import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  RefreshControl,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { api, Product } from '../../utils/api';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../utils/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 44) / 2; // Two columns grid with padding

export default function ProductsScreen() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [categories, setCategories] = useState<string[]>(['الكل']);

  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const { theme, isArabic } = useAppContext();

  const t = {
    all: isArabic ? 'الكل' : 'All',
    error: isArabic ? 'فصل تحميل المنتجات. يرجى المحاولة لاحقاً' : 'Failed to load products. Please try again',
    noStockAlert: isArabic ? 'عذراً، هذا المنتج غير متوفر حالياً في المخزن' : 'Sorry, this product is currently out of stock',
    loginAlert: isArabic ? 'يجب تسجيل الدخول أولاً لإجراء حجز' : 'You must login first to make a reservation',
    successReserve: isArabic ? 'تم الحجز بنجاح! يمكنك استلامه من الصالون.' : 'Reserved successfully! You can pick it up at the salon.',
    outOfStock: isArabic ? 'نفذت الكمية' : 'Out of Stock',
    searchPlaceholder: isArabic ? 'ابحث عن منتج...' : 'Search for a product...',
    noData: isArabic ? 'لا توجد منتجات مطابقة لخياراتك' : 'No products match your criteria',
    confirmTitle: isArabic ? 'تأكيد حجز المنتج' : 'Confirm Reservation',
    quantityLabel: isArabic ? 'الكمية المراد حجزها:' : 'Quantity to reserve:',
    totalLabel: isArabic ? 'السعر الإجمالي:' : 'Total Price:',
    confirmBtn: isArabic ? 'تأكيد الحجز الفوري' : 'Confirm Instant Reservation',
    available: isArabic ? 'المتوفر' : 'Available',
    reserveNow: isArabic ? 'حجز الآن' : 'Reserve Now',
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      setFilteredProducts(data);
      
      // Extract unique categories
      const uniqueCats = [t.all, ...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCats);
    } catch (err: any) {
      console.warn('Load products error:', err);
      Alert.alert('Error', t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Filter products based on search query and category
  useEffect(() => {
    let result = products;
    
    if (selectedCategory !== 'الكل') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    if (search) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    setFilteredProducts(result);
  }, [search, selectedCategory, products]);

  // Open reservation modal
  const openReservation = (product: Product) => {
    if (product.quantityInStock <= 0) {
      Alert.alert('Alert', t.noStockAlert);
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setReserveModalVisible(true);
  };

  // Confirm reservation and send to API
  const handleConfirmReservation = async () => {
    if (!selectedProduct) return;
    setReserving(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Alert', t.loginAlert);
        router.push('/(auth)/login');
        return;
      }

      await api.createReservation(token, selectedProduct._id, quantity);
      
      Alert.alert('Success', t.successReserve);
      setReserveModalVisible(false);
      
      // Reload products to update quantity in stock
      loadProducts();
    } catch (err: any) {
      console.warn('Confirm product reservation error:', err);
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء حجز المنتج');
    } finally {
      setReserving(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => router.push(`/product/${item._id}`)}
      >
        {item.imageURL ? (
          <Image source={{ uri: item.imageURL }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color="#444" />
          </View>
        )}
        {item.quantityInStock <= 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>{t.outOfStock}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.cardInfo}>
        <Text style={[styles.categoryBadge, { textAlign: isArabic ? 'right' : 'left' }]}>{item.category || 'العناية'}</Text>
        <Text style={[styles.productName, { color: theme.textPrimary, textAlign: isArabic ? 'right' : 'left' }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.price, { color: theme.textPrimary, textAlign: isArabic ? 'right' : 'left' }]}>{item.price} $</Text>
        
        <View style={[styles.stockRow, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
          <Text style={[styles.stockText, { color: theme.textSecondary }]}>
            {item.quantityInStock > 0 ? `${t.available}: ${item.quantityInStock}` : t.outOfStock}
          </Text>
          <Ionicons 
            name="cube-outline" 
            size={12} 
            color={item.quantityInStock > 0 ? theme.textSecondary : '#FF5252'} 
            style={isArabic ? { marginLeft: 4 } : { marginRight: 4 }} 
          />
        </View>

        <TouchableOpacity 
          style={[styles.reserveButton, item.quantityInStock <= 0 && styles.disabledButton, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}
          onPress={() => openReservation(item)}
          disabled={item.quantityInStock <= 0}
        >
          <Text style={styles.reserveButtonText}>{t.reserveNow}</Text>
          <Ionicons name="basket-outline" size={14} color="#121212" style={isArabic ? { marginRight: 4 } : { marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
        <Ionicons name="search-outline" size={20} color="#C5A880" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary, textAlign: isArabic ? 'right' : 'left' }]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchIcon}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          inverted
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                selectedCategory === item && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text 
                style={[
                  styles.categoryTabText, 
                  selectedCategory === item && styles.activeCategoryTabText
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C5A880" />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="sparkles" size={48} color={theme.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>{t.noData}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A880" />
          }
        />
      )}

      {/* Reservation Quantity Modal */}
      {selectedProduct && (
        <Modal
          visible={reserveModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReserveModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.modalHeader, { flexDirection: isArabic ? 'row' : 'row-reverse', borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => setReserveModalVisible(false)}>
                  <Ionicons name="close-circle-outline" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t.confirmTitle}</Text>
              </View>

              <View style={styles.modalBody}>
                {selectedProduct.imageURL && (
                  <Image source={{ uri: selectedProduct.imageURL }} style={styles.modalImage} />
                )}
                <Text style={[styles.modalProductName, { color: theme.textPrimary }]}>{selectedProduct.name}</Text>
                <Text style={[styles.modalProductPrice, { color: theme.textSecondary }]}>{selectedProduct.price} $</Text>
                
                <View style={[styles.quantityContainer, { backgroundColor: theme.bg, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.quantityLabel, { color: theme.textPrimary }]}>{t.quantityLabel}</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity 
                      style={styles.counterBtn} 
                      onPress={() => setQuantity(prev => Math.min(selectedProduct.quantityInStock, prev + 1))}
                    >
                      <Ionicons name="add" size={20} color="#121212" />
                    </TouchableOpacity>
                    
                    <Text style={[styles.counterVal, { color: theme.textPrimary }]}>{quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.counterBtn} 
                      onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <Ionicons name="remove" size={20} color="#121212" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.totalRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{t.totalLabel}</Text>
                  <Text style={styles.totalPrice}>{(selectedProduct.price * quantity).toFixed(2)} $</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.confirmButton, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}
                  onPress={handleConfirmReservation}
                  disabled={reserving}
                >
                  {reserving ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <>
                      <Text style={styles.confirmButtonText}>{t.confirmBtn}</Text>
                      <Ionicons name="checkbox-outline" size={18} color="#121212" style={isArabic ? { marginRight: 6 } : { marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.1)',
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'right',
    height: '100%',
  },
  clearSearchIcon: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryTab: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(197, 168, 128, 0.15)',
    borderColor: '#C5A880',
  },
  categoryTabText: {
    color: '#A0A0A0',
    fontSize: 13,
  },
  activeCategoryTabText: {
    color: '#C5A880',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  productsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.1)',
    marginBottom: 16,
    marginHorizontal: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    height: 130,
    width: '100%',
    backgroundColor: '#161616',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cardInfo: {
    padding: 12,
  },
  categoryBadge: {
    color: '#C5A880',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 6,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockText: {
    color: '#888',
    fontSize: 11,
  },
  reserveButton: {
    flexDirection: 'row',
    backgroundColor: '#C5A880',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  reserveButtonText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.2)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#C5A880',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalProductName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalProductPrice: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 20,
  },
  quantityContainer: {
    width: '100%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161616',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  quantityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    backgroundColor: '#C5A880',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  totalRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    color: '#A0A0A0',
    fontSize: 15,
  },
  totalPrice: {
    color: '#C5A880',
    fontSize: 22,
    fontWeight: 'bold',
  },
  confirmButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#C5A880',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
