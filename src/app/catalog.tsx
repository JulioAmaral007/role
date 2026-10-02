// TEMPORÁRIO (Fase 2): catálogo de componentes para o critério de saída "👀 no aparelho". Mostra
// todos os componentes do design system, a troca de idioma e blocos de estresse de texto. Sai da
// árvore depois da aprovação da Fase 2. Os títulos de seção abaixo são texto de desenvolvimento,
// por isso ficam fora dos arquivos de idioma.
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { Arrow } from '@/components/ui/icons/Arrow';
import { Back } from '@/components/ui/icons/Back';
import { Bolt } from '@/components/ui/icons/Bolt';
import { Calendar } from '@/components/ui/icons/Calendar';
import { Check } from '@/components/ui/icons/Check';
import { Clock } from '@/components/ui/icons/Clock';
import { Close } from '@/components/ui/icons/Close';
import { Compass } from '@/components/ui/icons/Compass';
import { Flag } from '@/components/ui/icons/Flag';
import { Logo } from '@/components/ui/icons/Logo';
import { Passport } from '@/components/ui/icons/Passport';
import { Pin } from '@/components/ui/icons/Pin';
import { Refresh } from '@/components/ui/icons/Refresh';
import { Settings } from '@/components/ui/icons/Settings';
import { Share } from '@/components/ui/icons/Share';
import { Smile } from '@/components/ui/icons/Smile';
import { Users } from '@/components/ui/icons/Users';
import { Wallet } from '@/components/ui/icons/Wallet';
import { WifiOff } from '@/components/ui/icons/WifiOff';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Pill } from '@/components/ui/Pill';
import { ProgressSegments } from '@/components/ui/ProgressSegments';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedGrid } from '@/components/ui/SegmentedGrid';
import { Text } from '@/components/ui/Text';
import { TicketDivider } from '@/components/ui/TicketDivider';
import { useDockInset } from '@/hooks/useDockInset';
import { useLanguage } from '@/hooks/useLanguage';
import i18n from '@/i18n';
import { formatCurrency, formatDistance, formatStampDate, formatWeekdayShort } from '@/i18n/format';
import { LANGUAGE_NAMES } from '@/i18n/languageNames';
import { colors, space } from '@/theme/tokens';
import { LOCALES, type LanguagePreference } from '@/types/language';

const MOODS = ['curious', 'lazy', 'romantic', 'restless', 'chill', 'social'] as const;
const TIME_SLOTS = ['1h', '2h', 'half_day', 'full_day'] as const;
const BUDGETS = ['free', 'up_to_30', 'up_to_80', 'any'] as const;
const ICONS = [
  <Logo key="Logo" />,
  <Bolt key="Bolt" />,
  <Arrow key="Arrow" />,
  <Compass key="Compass" />,
  <Passport key="Passport" />,
  <Users key="Users" />,
  <Back key="Back" />,
  <Close key="Close" />,
  <Pin key="Pin" />,
  <Smile key="Smile" />,
  <Clock key="Clock" />,
  <Wallet key="Wallet" />,
  <Refresh key="Refresh" />,
  <Calendar key="Calendar" />,
  <Share key="Share" />,
  <Check key="Check" />,
  <Settings key="Settings" />,
  <Flag key="Flag" />,
  <WifiOff key="WifiOff" />,
];

// Datas de exemplo: a do protótipo (sex, 02 out 2026) e o instante atual no fuso do aparelho.
const SAMPLE_DATE = new Date(Date.UTC(2026, 9, 2, 15, 0));
const SAMPLE_TIME_ZONE = 'America/Sao_Paulo';
const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Textos ~40% maiores que o pt-BR, para conferir que nada estoura (critério de saída).
const LONG_LABEL = 'Um rótulo bem mais comprido que o original';
const LONG_BUTTON = 'Um botão com um texto bem mais comprido';
const LONG_OPTIONS = [
  { id: 'a', label: 'Meio dia inteiro' },
  { id: 'b', label: 'O dia todinho' },
  { id: 'c', label: 'Até uns R$ 30' },
  { id: 'd', label: 'Tanto faz mesmo' },
] as const;

export default function CatalogScreen() {
  const { t } = useTranslation();
  const { preference, locale, setLanguage } = useLanguage();
  const dockInset = useDockInset();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [mood, setMood] = useState<(typeof MOODS)[number] | undefined>('curious');
  const [time, setTime] = useState<(typeof TIME_SLOTS)[number] | undefined>('2h');
  const [budget, setBudget] = useState<(typeof BUDGETS)[number] | undefined>('up_to_30');
  const [longChoice, setLongChoice] = useState<string | undefined>('a');

  // Faz o papel do I18nProvider da Fase 3: aplica o idioma efetivo (inclusive o salvo ao reabrir).
  useEffect(() => {
    i18n.changeLanguage(locale).catch(() => {});
  }, [locale]);

  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.languageSystem') },
    ...LOCALES.map((value) => ({ value, label: LANGUAGE_NAMES[value] })),
  ];

  const tabs = [
    { key: 'index', label: t('tabs.home'), icon: Compass },
    { key: 'passport', label: t('tabs.passport'), icon: Passport },
    { key: 'crew', label: t('tabs.crew'), icon: Users },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: dockInset }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text variant="display34">Catálogo</Text>
        <Text variant="body" color={colors.olive}>
          Tela temporária da Fase 2. Padding de baixo do scroll: {dockInset} (106 + safe area {safeAreaBottom}).
        </Text>

        <Block title="Idioma (troca na hora)">
          <View style={styles.wrap}>
            {languageOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={preference === option.value}
                onPress={() => setLanguage(option.value)}
              />
            ))}
          </View>
          <Text variant="caption" color={colors.olive}>
            Efetivo: {locale}
          </Text>
        </Block>

        <Block title="Rolê">
          <View style={styles.row}>
            <Text variant="wordmark">{t('app.wordmark')}</Text>
            <Pill icon={Bolt} label={t('home.streak', { count: 3 })} />
          </View>
          <Text variant="display34">{t('home.title')}</Text>
          <SectionLabel label={t('home.moodTitle')} />
          <View style={styles.wrap}>
            {MOODS.map((id) => (
              <Chip key={id} label={t(`mood.${id}`)} selected={mood === id} onPress={() => setMood(id)} />
            ))}
          </View>
          <SectionLabel label={t('home.timeTitle')} />
          <SegmentedGrid
            options={TIME_SLOTS.map((id) => ({ id, label: t(`timeSlot.${id}`) }))}
            value={time}
            onChange={setTime}
          />
          <SectionLabel label={t('home.budgetTitle')} />
          <SegmentedGrid
            options={BUDGETS.map((id) => ({ id, label: t(`budget.${id}`) }))}
            value={budget}
            onChange={setBudget}
          />
          <Button size="large" justify="space-between">
            <ButtonText label={t('home.cta')} />
            <ButtonIcon icon={Arrow} />
          </Button>
          <Text variant="caption" color={colors.olive}>
            {t('home.quota', { remaining: 1, count: 3 })} · {t('home.quota', { remaining: 2, count: 3 })}
          </Text>
        </Block>

        <Block title="Sugestão (plural: 1 e 2 restantes)">
          <View style={styles.row}>
            <Pill label={t('suggestion.remaining', { count: 1 })} />
            <Pill label={t('suggestion.remaining', { count: 2 })} />
            <Pill label={t('suggestion.remaining', { count: 3 })} />
          </View>
          <Card tone="ticket">
            <View style={styles.ticketBody}>
              <View style={styles.row}>
                <Pill tone="tag" label={t('category.hidden_cafe')} />
                <Pill tone="tagOutline" label={t('suggestion.neverStamped')} />
              </View>
              <Text variant="display32">Café do Porão</Text>
              <View style={styles.row}>
                <Pin />
                <Text variant="body" color={colors.gray}>
                  Rua das Laranjeiras, 214 · {formatDistance(1800, locale)}
                </Text>
              </View>
            </View>
            <TicketDivider />
            <View style={styles.ticketBody}>
              <SectionLabel label={t('suggestion.whyTitle')} tone="gray" />
              <View style={styles.row}>
                <Smile />
                <Text variant="body">
                  {t('suggestion.moodLead', { label: t('mood.curious') })} Exemplo de motivo.
                </Text>
              </View>
              <View style={styles.row}>
                <Clock />
                <Text variant="body">{t('suggestion.timeLead.2h')} Exemplo de motivo.</Text>
              </View>
              <View style={styles.row}>
                <Wallet />
                <Text variant="body">
                  {t('suggestion.budgetLead', { label: t('budget.up_to_30') })} {formatCurrency(24, locale)}.
                </Text>
              </View>
            </View>
          </Card>
          <Button size="cta" justify="space-between">
            <ButtonText label={t('suggestion.go')} />
            <ButtonIcon icon={Arrow} />
          </Button>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button size="compact" variant="outline">
                <ButtonIcon icon={Refresh} />
                <ButtonText label={t('suggestion.other')} />
              </Button>
            </View>
            <View style={styles.flex}>
              <Button size="compact" variant="cream">
                <ButtonIcon icon={Calendar} />
                <ButtonText label={t('suggestion.reserve')} />
              </Button>
            </View>
            <View style={styles.flex}>
              <Button size="compact" variant="cream">
                <ButtonIcon icon={Pin} />
                <ButtonText label={t('suggestion.directions')} />
              </Button>
            </View>
          </View>
        </Block>

        <Block title="Carimbo (datas e ordinal)" tone="blue">
          <SectionLabel label={formatWeekdayShort(SAMPLE_DATE, locale, SAMPLE_TIME_ZONE)} tone="lavender" />
          <Text variant="display50" color={colors.yellow}>
            {t('stamp.title')}
          </Text>
          <Text variant="bodyLarge" color={colors.lavender}>
            {t('stamp.body', { count: 3, place: 'Café do Porão', ordinal: true })}
          </Text>
          {[1, 2, 4, 11, 21].map((count) => (
            <Text key={count} variant="caption" color={colors.lavender}>
              {t('stamp.body', { count, place: 'X', ordinal: true })}
            </Text>
          ))}
          <Text variant="statLg" color={colors.yellow}>
            {t('stamp.sealNumber', { number: 14 })}
          </Text>
          <Text variant="label" color={colors.yellow}>
            {formatStampDate(SAMPLE_DATE, SAMPLE_TIME_ZONE)} · {formatWeekdayShort(new Date(), locale, DEVICE_TIME_ZONE)}
          </Text>
          <Card tone="blueDark">
            <View style={styles.rowBetween}>
              <SectionLabel label={t('goal.description', { count: 3 })} tone="lavender" />
              <Pill tone="yellow" label="3/3" />
            </View>
            <ProgressSegments total={3} filled={3} accessibilityLabel={t('goal.description', { count: 3 })} />
            <Text variant="caption" color={colors.lavender}>
              {t('stamp.goalReached', { done: 7, total: 16 })}
            </Text>
          </Card>
          <Button variant="accent" size="cta">
            <ButtonIcon icon={Share} />
            <ButtonText label={t('stamp.share')} />
          </Button>
          <Button variant="outlineInverse" size="medium">
            <ButtonText label={t('stamp.viewPassport')} />
          </Button>
        </Block>

        <Block title="Passaporte e Plus (números)" tone="cream">
          <View style={styles.row}>
            <Text variant="statLg">14</Text>
            <Text variant="statLg">{t('passport.streakValue', { count: 3 })}</Text>
            <Text variant="statLg">{t('passport.bingoCount', { done: 7, total: 16 })}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="caption">{t('passport.stampsLabel')}</Text>
            <Text variant="caption">{t('passport.streakLabel')}</Text>
            <Text variant="caption">{t('passport.bingoLabel')}</Text>
          </View>
          <Card tone="outline">
            <Text variant="title">{t('passport.streakTitle')}</Text>
            <Text variant="body" color={colors.gray}>
              {t('passport.streakHint')}
            </Text>
          </Card>
          <Card tone="blue">
            <SectionLabel label={t('goal.description', { count: 3 })} tone="lavender" />
            <Text variant="price" color={colors.cream}>
              {t('plus.pricePerMonth', { price: formatCurrency(19.9, locale) })} ·{' '}
              {t('plus.pricePerYear', { price: formatCurrency(199, locale) })}
            </Text>
          </Card>
        </Block>

        <Block title="Estados">
          <OfflineBanner label="Sem conexão. Seu passaporte continua aqui." />
          <EmptyState icon={Compass} title="Nada por aqui ainda" message="Seu primeiro carimbo vai aparecer aqui." />
          <ErrorState
            icon={WifiOff}
            title="Não deu pra carregar"
            message="Confira a conexão e tente de novo."
            retryLabel="Tentar de novo"
            onRetry={() => {}}
          />
        </Block>

        <Block title="Estresse de texto (~40% maior)">
          <View style={styles.wrap}>
            <Chip label={LONG_LABEL} selected onPress={() => {}} />
            <Chip label={LONG_LABEL} selected={false} onPress={() => {}} />
          </View>
          <SegmentedGrid options={LONG_OPTIONS} value={longChoice} onChange={setLongChoice} />
          <Pill label={LONG_LABEL} />
          <Pill tone="tag" label={LONG_LABEL} />
          <Button size="cta" justify="space-between">
            <ButtonText label={LONG_BUTTON} />
            <ButtonIcon icon={Arrow} />
          </Button>
          <Button size="compact" variant="outline">
            <ButtonIcon icon={Refresh} />
            <ButtonText label={LONG_BUTTON} />
          </Button>
        </Block>

        <Block title="Ícones (tamanho padrão)">
          <View style={styles.wrap}>
            {ICONS}
          </View>
        </Block>
      </ScrollView>

      <FloatingTabBar
        items={tabs}
        activeIndex={tab}
        bottomInset={safeAreaBottom}
        onPress={setTab}
      />
    </View>
  );
}

interface BlockProps {
  title: string;
  tone?: 'yellow' | 'blue' | 'cream';
  children: ReactNode;
}

function Block({ title, tone = 'yellow', children }: BlockProps) {
  return (
    <View style={[styles.block, tone === 'blue' && styles.blockBlue, tone === 'cream' && styles.blockCream]}>
      <Text variant="label" color={tone === 'blue' ? colors.lavender : colors.olive} accessibilityRole="header">
        {`— ${title}`}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.yellow,
  },
  content: {
    gap: space[20],
    paddingTop: 52,
    paddingHorizontal: space[20],
  },
  block: {
    gap: space[12],
  },
  blockBlue: {
    backgroundColor: colors.blue,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: space[16],
  },
  blockCream: {
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: space[16],
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space[8],
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  flex: {
    flex: 1,
  },
  ticketBody: {
    gap: space[8],
    paddingHorizontal: space[20],
    paddingVertical: space[16],
  },
});
