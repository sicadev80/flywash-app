import GlideScreen from '../../components/glide/GlideScreen';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProjectStore, type ProjectItem } from '../../lib/projectStore';

const GOLD = '#B38918';
const TEXT = '#17171C';
const MUTED = '#74747D';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function isCompletedWithDate(project: ProjectItem): project is ProjectItem & { completedAt: string } {
  return !!project.completedAt;
}

export default function RevenueSummaryScreen() {
  const projects = useProjectStore((state) => state.projects);

  const completedProjects = useMemo(() => projects.filter(isCompletedWithDate), [projects]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthProjects = useMemo(
    () =>
      completedProjects.filter((project) => {
        const d = new Date(project.completedAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }),
    [completedProjects, currentYear, currentMonth]
  );

  const yearProjects = useMemo(
    () => completedProjects.filter((project) => new Date(project.completedAt).getFullYear() === currentYear),
    [completedProjects, currentYear]
  );

  const monthTotal = useMemo(
    () => monthProjects.reduce((sum, project) => sum + (project.quoteAmount || 0), 0),
    [monthProjects]
  );

  const yearTotal = useMemo(
    () => yearProjects.reduce((sum, project) => sum + (project.quoteAmount || 0), 0),
    [yearProjects]
  );

  const monthBreakdown = useMemo(() => {
    const totals = new Array(12).fill(0);
    yearProjects.forEach((project) => {
      const monthIndex = new Date(project.completedAt).getMonth();
      totals[monthIndex] += project.quoteAmount || 0;
    });
    const max = Math.max(...totals, 1);
    return totals.map((total, index) => ({
      label: MONTH_LABELS[index],
      total,
      ratio: total / max,
      isCurrent: index === currentMonth,
    }));
  }, [yearProjects, currentMonth]);

  return (
    <GlideScreen title="Résumé">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroRow}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Ce mois-ci</Text>
            <Text style={styles.heroValue}>{fmt(monthTotal)} €</Text>
            <Text style={styles.heroSub}>
              {monthProjects.length} chantier{monthProjects.length > 1 ? 's' : ''} terminé
              {monthProjects.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>{currentYear}</Text>
            <Text style={styles.heroValue}>{fmt(yearTotal)} €</Text>
            <Text style={styles.heroSub}>
              {yearProjects.length} chantier{yearProjects.length > 1 ? 's' : ''} terminé
              {yearProjects.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Synthèse {currentYear}, mois par mois</Text>

        <View style={styles.breakdownCard}>
          {monthBreakdown.map((row) => (
            <View key={row.label} style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, row.isCurrent && styles.breakdownLabelCurrent]}>
                {row.label}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${row.total > 0 ? Math.max(row.ratio * 100, 4) : 0}%` },
                    row.isCurrent && styles.barFillCurrent,
                  ]}
                />
              </View>
              <Text style={styles.breakdownValue}>{fmt(row.total)} €</Text>
            </View>
          ))}
        </View>

        {completedProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun chantier terminé pour le moment</Text>
            <Text style={styles.emptyText}>
              Le chiffre d'affaires apparaîtra ici dès qu'un chantier sera clôturé (montant du devis
              associé).
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  heroRow: { flexDirection: 'row', gap: 12 },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFF8E8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7CF86',
    padding: 16,
    gap: 4,
  },
  heroLabel: { color: MUTED, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  heroValue: { color: TEXT, fontSize: 24, fontWeight: '900' },
  heroSub: { color: GOLD, fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 16,
    gap: 12,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownLabel: { color: TEXT, fontSize: 13, width: 68 },
  breakdownLabelCurrent: { color: GOLD, fontWeight: '800' },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F1F1F4',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#E7CF86',
  },
  barFillCurrent: { backgroundColor: '#D4AF37' },
  breakdownValue: { color: TEXT, fontSize: 13, fontWeight: '700', width: 78, textAlign: 'right' },
  emptyCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 14, marginTop: 4, lineHeight: 20 },
});
