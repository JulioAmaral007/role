// Um `expo-file-system` falso, em memória, para os testes (o módulo real é nativo e não existe no
// Jest). Imita o que o app usa da API de `File`, `Directory` e `Paths` do SDK 57, inclusive os erros:
// apagar o que não existe, copiar por cima de um arquivo que existe e criar dentro de uma pasta que
// não existe lançam, como no real. Uso:
//   jest.mock('expo-file-system', () => jest.requireActual('@/test/fakeExpoFileSystem'));

type EntryKind = 'file' | 'directory';

const entries = new Map<string, EntryKind>();

const DOCUMENT_URI = 'file:///data/user/0/app/files';

function normalize(uri: string): string {
  return uri.replace(/\/+$/, '');
}

type UriPart = string | { uri: string };

function join(parts: readonly UriPart[]): string {
  const [first, ...rest] = parts.map((part) => normalize(typeof part === 'string' ? part : part.uri));
  return [first, ...rest.map((part) => part.replace(/^\/+/, ''))].join('/');
}

function parentOf(uri: string): string {
  return uri.slice(0, uri.lastIndexOf('/'));
}

function nameOf(uri: string): string {
  return uri.slice(uri.lastIndexOf('/') + 1);
}

function ensureParentExists(uri: string): void {
  const parent = parentOf(uri);
  if (parent !== DOCUMENT_URI && entries.get(parent) !== 'directory' && !parent.endsWith('/cache')) {
    throw new Error(`Parent directory does not exist: ${parent}`);
  }
}

export class File {
  readonly uri: string;

  constructor(...parts: UriPart[]) {
    this.uri = join(parts);
  }

  get name(): string {
    return nameOf(this.uri);
  }

  get exists(): boolean {
    return entries.get(this.uri) === 'file';
  }

  async copy(destination: File | Directory, options: { overwrite?: boolean } = {}): Promise<void> {
    if (!this.exists) throw new Error(`Source file does not exist: ${this.uri}`);
    const target = destination instanceof Directory ? join([destination, this.name]) : destination.uri;
    if (destination instanceof Directory && !destination.exists) {
      throw new Error(`Destination directory does not exist: ${destination.uri}`);
    }
    ensureParentExists(target);
    if (entries.get(target) === 'file' && !options.overwrite) {
      throw new Error(`Destination already exists: ${target}`);
    }
    entries.set(target, 'file');
  }

  delete(): void {
    if (!this.exists) throw new Error(`File does not exist: ${this.uri}`);
    entries.delete(this.uri);
  }
}

export class Directory {
  readonly uri: string;

  constructor(...parts: UriPart[]) {
    this.uri = `${join(parts)}/`;
  }

  private get key(): string {
    return normalize(this.uri);
  }

  get name(): string {
    return nameOf(this.key);
  }

  get exists(): boolean {
    return entries.get(this.key) === 'directory' || this.key === DOCUMENT_URI;
  }

  create(options: { intermediates?: boolean; idempotent?: boolean } = {}): void {
    if (this.exists) {
      if (options.idempotent) return;
      throw new Error(`Directory already exists: ${this.uri}`);
    }
    if (options.intermediates) {
      for (let parent = parentOf(this.key); parent.length > DOCUMENT_URI.length; parent = parentOf(parent)) {
        entries.set(parent, 'directory');
      }
    } else {
      ensureParentExists(this.key);
    }
    entries.set(this.key, 'directory');
  }

  list(): (File | Directory)[] {
    if (!this.exists) throw new Error(`Directory does not exist: ${this.uri}`);
    const prefix = `${this.key}/`;
    const children: (File | Directory)[] = [];
    for (const [uri, kind] of entries) {
      if (uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/')) {
        children.push(kind === 'directory' ? new Directory(uri) : new File(uri));
      }
    }
    return children;
  }

  /** Apaga a pasta e tudo que há dentro dela. */
  delete(): void {
    if (!this.exists) throw new Error(`Directory does not exist: ${this.uri}`);
    const prefix = `${this.key}/`;
    for (const uri of [...entries.keys()]) {
      if (uri === this.key || uri.startsWith(prefix)) entries.delete(uri);
    }
  }
}

export const Paths = {
  document: new Directory(DOCUMENT_URI),
  cache: new Directory('file:///data/user/0/app/cache'),
};

/** Esvazia o sistema de arquivos falso (use no `beforeEach`). */
export function resetFakeFileSystem(): void {
  entries.clear();
}

/** Cria um arquivo qualquer, como o que o seletor de imagens deixaria no cache. */
export function addFakeFile(uri: string): void {
  entries.set(normalize(uri), 'file');
}

/** Todos os arquivos que existem, em ordem alfabética. */
export function listFakeFiles(): string[] {
  return [...entries.entries()]
    .filter(([, kind]) => kind === 'file')
    .map(([uri]) => uri)
    .sort();
}
