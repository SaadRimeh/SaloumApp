import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, Item } from '../../utils/api';
import { useAppContext } from '../../utils/ThemeContext';

export default function PerfumesScreen() {
  const { theme, isArabic } = useAppContext();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

  const loadData = async () => {
    try {
      setError('');
      const fetchedItems = await api.getItems();
      setItems(fetchedItems);
    } catch (err: any) {
      console.warn('Load perfumes error:', err);
      setError('فشل تحميل العطورات. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGenderInfo = (gender: string) => {
    const g = gender?.toLowerCase() || '';
    if (g === 'male' || g === 'men') {
      return { text: 'رجالي', icon: 'male-outline' as const, color: '#6A92D4' };
    } else if (g === 'female' || g === 'women') {
      return { text: 'نسواني', icon: 'female-outline' as const, color: '#D46A92' };
    } else {
      return { text: 'نسواني ورجالي', icon: 'male-female-outline' as const, color: '#C5A880' };
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    const g = item.gender?.toLowerCase() || '';
    if (filter === 'male') return g === 'male' || g === 'men';
    if (filter === 'female') return g === 'female' || g === 'women';
    return true;
  });

  const t = {
    all: isArabic ? 'الكل' : 'All',
    male: isArabic ? 'رجالي' : 'Men',
    female: isArabic ? 'نسواني' : 'Women',
    noData: isArabic ? 'لا توجد عطورات متاحة حالياً' : 'No perfumes available currently',
    error: isArabic ? 'فشل تحميل العطورات. يرجى المحاولة لاحقاً' : 'Failed to load perfumes. Please try again',
  };

  const renderItem = ({ item }: { item: Item }) => {
    const genderInfo = getGenderInfo(item.gender);
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconContainer, isArabic ? { marginLeft: 16 } : { marginRight: 16 }]}>
          <Ionicons name="flask-outline" size={32} color="#C5A880" />
        </View>
        <View style={[styles.infoContainer, { alignItems: isArabic ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name.toUpperCase()}</Text>
          <View style={[styles.genderBadge, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
            <Text style={[styles.genderText, { color: genderInfo.color }]}>
              {genderInfo.text}
            </Text>
            <Ionicons name={genderInfo.icon} size={14} color={genderInfo.color} style={isArabic ? { marginLeft: 6 } : { marginRight: 6 }} />
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price} $</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Filters */}
      <View style={[styles.filterContainer, { borderBottomColor: theme.border, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>{t.all}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'male' && styles.filterBtnActive]}
          onPress={() => setFilter('male')}
        >
          <Text style={[styles.filterText, filter === 'male' && styles.filterTextActive]}>{t.male}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filter === 'female' && styles.filterBtnActive]}
          onPress={() => setFilter('female')}
        >
          <Text style={[styles.filterText, filter === 'female' && styles.filterTextActive]}>{t.female}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#C5A880" style={{ marginTop: 50 }} />
      ) : error ? (
        <Text style={styles.errorText}>{t.error}</Text>
      ) : filteredItems.length === 0 ? (
        <Text style={[styles.noDataText, { color: theme.textSecondary }]}>{t.noData}</Text>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A880" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.3)',
  },
  filterBtnActive: {
    backgroundColor: '#C5A880',
    borderColor: '#C5A880',
  },
  filterText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#121212',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(197, 168, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  price: {
    color: '#C5A880',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginTop: 50,
  },
  noDataText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});
