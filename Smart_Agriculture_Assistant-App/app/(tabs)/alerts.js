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
  createAlert,
  deleteAlert,
  fetchAlerts,
  markAllAlertsRead,
  updateAlert,
} from '../../services/alertService';

const severities = ['low', 'medium', 'high', 'critical'];
const categories = ['weather', 'crop', 'livestock', 'market', 'system'];

const severityColor = {
  low: '#65A30D',
  medium: '#2563EB',
  high: '#D97706',
  critical: '#DC2626',
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('system');
  const [severity, setSeverity] = useState('medium');

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (_error) {
      Alert.alert('Error', 'Could not load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const unreadCount = useMemo(() => alerts.filter((item) => !item.is_read).length, [alerts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const onCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation', 'Title and message are required.');
      return;
    }

    try {
      await createAlert({
        title: title.trim(),
        message: message.trim(),
        category,
        severity,
      });
      setTitle('');
      setMessage('');
      setCategory('system');
      setSeverity('medium');
      setModalOpen(false);
      loadAlerts();
    } catch (_error) {
      Alert.alert('Error', 'Could not create alert.');
    }
  };

  const onMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      loadAlerts();
    } catch (_error) {
      Alert.alert('Error', 'Could not update alerts.');
    }
  };

  const onToggleRead = async (item) => {
    try {
      await updateAlert(item.id, { is_read: !item.is_read });
      loadAlerts();
    } catch (_error) {
      Alert.alert('Error', 'Could not update alert status.');
    }
  };

  const onDelete = (item) => {
    Alert.alert('Delete alert', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAlert(item.id);
            loadAlerts();
          } catch (_error) {
            Alert.alert('Error', 'Could not delete alert.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.alertCard}>
      <View style={styles.alertTopRow}>
        <View style={styles.alertTitleWrap}>
          <View
            style={[
              styles.severityDot,
              { backgroundColor: severityColor[item.severity] || theme.colors.warning },
            ]}
          />
          <Text style={styles.alertTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.meta}>{item.severity}</Text>
        <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        style={[styles.readButton, item.is_read && styles.readButtonDone]}
        onPress={() => onToggleRead(item)}
      >
        <Text style={styles.readButtonText}>{item.is_read ? 'Mark unread' : 'Mark read'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Alerts Center</Text>
          <Text style={styles.subheading}>{unreadCount} unread alerts</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={onMarkAllRead}>
            <Ionicons name="checkmark-done" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyState}>No alerts yet. Create one with +.</Text> : null
        }
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Alert</Text>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message"
              value={message}
              multiline
              onChangeText={setMessage}
            />
            <Text style={styles.pickerLabel}>Category</Text>
            <View style={styles.choiceRow}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.choiceChip, category === item && styles.choiceChipActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={category === item ? styles.choiceTextActive : styles.choiceText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.pickerLabel}>Severity</Text>
            <View style={styles.choiceRow}>
              {severities.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.choiceChip, severity === item && styles.choiceChipActive]}
                  onPress={() => setSeverity(item)}
                >
                  <Text style={severity === item ? styles.choiceTextActive : styles.choiceText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={onCreate}>
                <Text style={styles.saveText}>Save</Text>
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
    margin: 16,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadow,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subheading: {
    color: '#D9F7E6',
    marginTop: 4,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  alertCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    ...theme.shadow,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '800',
    flex: 1,
  },
  alertMessage: {
    color: theme.colors.mutedText,
    marginTop: 8,
    lineHeight: 19,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 12,
    color: '#4A5D51',
    backgroundColor: '#ECF3EE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  readButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E6F2EB',
  },
  readButtonDone: {
    backgroundColor: '#E8EDF8',
  },
  readButtonText: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: theme.colors.mutedText,
    marginTop: 30,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D2E2D7',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F9FBF8',
    marginBottom: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerLabel: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  choiceChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EDF4EE',
  },
  choiceChipActive: {
    backgroundColor: theme.colors.primary,
  },
  choiceText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  choiceTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EEF3EF',
  },
  cancelText: {
    fontWeight: '700',
    color: '#4E5F54',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  saveText: {
    fontWeight: '700',
    color: '#fff',
  },
});
