import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import {
  createMarketPrice,
  deleteMarketPrice,
  fetchMarketOverview,
  fetchMarketPrices,
} from '../../services/marketPriceService';

const trends = ['up', 'down', 'stable'];

export default function MarketPriceScreen() {
  const [entries, setEntries] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [commodity, setCommodity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [marketLocation, setMarketLocation] = useState('');
  const [trend, setTrend] = useState('stable');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, overviewData] = await Promise.all([fetchMarketPrices(), fetchMarketOverview()]);
      setEntries(entriesData);
      setOverview(overviewData);
    } catch (_error) {
      Alert.alert('Error', 'Could not load market prices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const topCommodity = useMemo(() => {
    if (!overview?.by_crop?.length) return 'No data';
    return overview.by_crop[0].commodity;
  }, [overview]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const clearForm = () => {
    setCommodity('');
    setPrice('');
    setUnit('kg');
    setMarketLocation('');
    setTrend('stable');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const onCreate = async () => {
    if (!commodity.trim() || !marketLocation.trim() || !price.trim() || Number.isNaN(Number(price))) {
      Alert.alert('Validation', 'Commodity, market and numeric price are required.');
      return;
    }

    try {
      await createMarketPrice({
        commodity: commodity.trim(),
        market_location: marketLocation.trim(),
        unit: unit.trim() || 'kg',
        trend,
        price: Number(price),
        notes: notes.trim(),
        date,
      });
      setModalOpen(false);
      clearForm();
      loadData();
    } catch (error) {
      const message = error?.response?.data?.non_field_errors?.[0] || 'Could not save this price entry.';
      Alert.alert('Error', message);
    }
  };

  const onDelete = (item) => {
    Alert.alert('Delete entry', `Delete ${item.commodity} (${item.market_location})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMarketPrice(item.id);
            loadData();
          } catch (_error) {
            Alert.alert('Error', 'Could not delete entry.');
          }
        },
      },
    ]);
  };

  const renderEntry = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()} style={styles.entryCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.entryTitle}>{item.commodity}</Text>
        <TouchableOpacity onPress={() => onDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.entryPrice}>
        R {Number(item.price).toFixed(2)} / {item.unit}
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.entryMeta}>{item.market_location}</Text>
        <Text style={[styles.trendTag, styles[`trend_${item.trend}`]]}>{item.trend}</Text>
      </View>
      <Text style={styles.entryMeta}>{item.date}</Text>
      {item.notes ? <Text style={styles.note}>{item.notes}</Text> : null}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Market Intelligence</Text>
          <Text style={styles.subheading}>Track produce prices and trends</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Entries</Text>
          <Text style={styles.kpiValue}>{overview?.records_count ?? 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Last 7 Days</Text>
          <Text style={styles.kpiValue}>{overview?.recent_records_count ?? 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Top Crop</Text>
          <Text style={styles.kpiValueSmall}>{topCommodity}</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEntry}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No market entries yet.</Text> : null}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Market Price</Text>
            <TextInput style={styles.input} value={commodity} onChangeText={setCommodity} placeholder="Commodity" />
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Price" />
            <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="Unit (kg, bag)" />
            <TextInput style={styles.input} value={marketLocation} onChangeText={setMarketLocation} placeholder="Market location" />
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <View style={styles.choiceRow}>
              {trends.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setTrend(item)}
                  style={[styles.choiceChip, trend === item && styles.choiceChipActive]}
                >
                  <Text style={trend === item ? styles.choiceTextActive : styles.choiceText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onCreate}>
                <Text style={styles.saveText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: '#27483A',
    padding: 16,
    ...theme.shadow,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
  },
  subheading: {
    color: '#D8EEF9',
    fontWeight: '600',
    marginTop: 4,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27483A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    ...theme.shadow,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#5F6D74',
    fontWeight: '600',
  },
  kpiValue: {
    marginTop: 6,
    fontSize: 18,
    color: '#27483A',
    fontWeight: '800',
  },
  kpiValueSmall: {
    marginTop: 6,
    fontSize: 13,
    color: '#27483A',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#27483A',
  },
  entryPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#27483A',
    marginTop: 4,
  },
  entryMeta: {
    marginTop: 6,
    color: '#5D6C75',
    fontWeight: '600',
  },
  trendTag: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  trend_up: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  trend_down: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  trend_stable: {
    backgroundColor: '#E0F2FE',
    color: '#394f46',
  },
  note: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 34,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#27483A',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#D1DEE7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  choiceChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EDF4F8',
  },
  choiceChipActive: {
    backgroundColor: '#1D5E7A',
  },
  choiceText: {
    color: '#27483A',
    fontWeight: '700',
    fontSize: 12,
  },
  choiceTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  modalActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#EBF0F4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#42624f',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#1d7a64',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
