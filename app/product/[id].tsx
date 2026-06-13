import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { api, Product } from '../../utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../utils/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reservation Modal States
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const { theme, isArabic } = useAppContext();
  const insets = useSafeAreaInsets();

  const t = {
    errorLoad: isArabic ? 'فشل تحميل تفاصيل المنتج. يرجى المحاولة لاحقاً' : 'Failed to load product details. Please try again',
    loginAlert: isArabic ? 'يجب تسجيل الدخول أولاً لإجراء حجز' : 'You must login first to make a reservation',
    successTitle: isArabic ? 'تم الحجز بنجاح' : 'Reservation Successful',
    successMsg: (q: number, n: string) => isArabic ? `تم حجز (${q}) من منتج ${n} بنجاح! يمكنك استلامه من الصالون وتفعيله في زيارتك القادمة.` : `Successfully reserved (${q}) of ${n}! You can pick it up at the salon.`,
    ok: isArabic ? 'موافق' : 'OK',
    errorReserve: isArabic ? 'حدث خطأ أثناء حجز المنتج' : 'Error occurred while reserving',
    notFound: isArabic ? 'المنتج غير موجود' : 'Product not found',
    featuresTitle: isArabic ? 'المميزات الرئيسية' : 'Key Features',
    f1: isArabic ? 'منتج أصلي 100%' : '100% Original',
    f2: isArabic ? 'جودة ممتازة' : 'Premium Quality',
    f3: isArabic ? 'توصية خبراء' : 'Expert Recommended',
    descTitle: isArabic ? 'الوصف والتفاصيل' : 'Description & Details',
    noDesc: isArabic ? 'لا يوجد وصف متاح لهذا المنتج.' : 'No description available for this product.',
    stockLabel: isArabic ? 'حالة المخزون:' : 'Stock Status:',
    inStock: (q: number) => isArabic ? `متوفر (${q} قطع متبقية)` : `In Stock (${q} left)`,
    outOfStock: isArabic ? 'نفذت الكمية' : 'Out of Stock',
    bookBtn: isArabic ? 'حجز واستلام من الصالون' : 'Reserve & Pick up',
    modalTitle: isArabic ? 'تحديد كمية الحجز' : 'Select Quantity',
    modalQuantity: isArabic ? 'الكمية المطلوبة:' : 'Quantity:',
    totalLabel: isArabic ? 'السعر الإجمالي:' : 'Total Price:',
    confirmBtn: isArabic ? 'تأكيد وحجز المنتج' : 'Confirm Reservation',
  };

  const loadProductDetails = async () => {
    try {
      if (id) {
        const data = await api.getProductById(id);
        setProduct(data);
      }
    } catch (err: any) {
      console.warn('Load product error:', err);
      Alert.alert('Error', t.errorLoad);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetails();
  }, [id]);

  const handleConfirmReservation = async () => {
    if (!product) return;
    setReserving(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Alert', t.loginAlert);
        router.push('/(auth)/login');
        return;
      }

      await api.createReservation(token, product._id, quantity);
      
      Alert.alert(
        t.successTitle, 
        t.successMsg(quantity, product.name),
        [{ text: t.ok, onPress: () => {
          setReserveModalVisible(false);
          router.replace('/(tabs)/profile');
        }}]
      );
    } catch (err: any) {
      console.warn('Reserve product error:', err);
      Alert.alert('Error', err.message || t.errorReserve);
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#C5A880" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Text style={styles.errorText}>{t.notFound}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          {product.imageURL ? (
            <Image source={{ uri: product.imageURL }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={72} color={theme.textSecondary} />
            </View>
          )}
        </View>

        {/* Details Card */}
        <View style={[styles.detailsContainer, { alignItems: isArabic ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.categoryBadge}>{product.category || 'العناية بالرجل'}</Text>
          <Text style={[styles.productName, { color: theme.textPrimary, textAlign: isArabic ? 'right' : 'left' }]}>{product.name}</Text>
          <Text style={[styles.price, { textAlign: isArabic ? 'right' : 'left' }]}>{product.price} $</Text>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Key Features Icons */}
          <View style={[styles.featuresRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#C5A880" />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{t.f1}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="sparkles-outline" size={22} color="#C5A880" />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{t.f2}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="ribbon-outline" size={22} color="#C5A880" />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{t.f3}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Description */}
          <Text style={[styles.descTitle, { color: theme.textPrimary, textAlign: isArabic ? 'right' : 'left' }]}>{t.descTitle}</Text>
          <Text style={[styles.descContent, { color: theme.textSecondary, textAlign: isArabic ? 'right' : 'left' }]}>
            {product.description || t.noDesc}
          </Text>

          {/* Stock Info */}
          <View style={[styles.stockRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.stockLabel, { color: theme.textPrimary }, isArabic ? { marginLeft: 8 } : { marginRight: 8 }]}>{t.stockLabel}</Text>
            <Text style={[styles.stockValue, product.quantityInStock <= 0 && styles.outOfStockText]}>
              {product.quantityInStock > 0 ? t.inStock(product.quantityInStock) : t.outOfStock}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Booking Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.headerBg, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
        <TouchableOpacity 
          style={[styles.bookBtn, product.quantityInStock <= 0 && styles.disabledBookBtn, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}
          disabled={product.quantityInStock <= 0}
          onPress={() => {
            setQuantity(1);
            setReserveModalVisible(true);
          }}
        >
          <Text style={styles.bookBtnText}>{t.bookBtn}</Text>
          <Ionicons name="basket-outline" size={18} color="#121212" style={isArabic ? { marginRight: 8 } : { marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* Reservation Quantity Modal */}
      <Modal
        visible={reserveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReserveModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border, flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
              <TouchableOpacity onPress={() => setReserveModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t.modalTitle}</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalProductName, { color: theme.textPrimary }]}>{product.name}</Text>
              <Text style={[styles.modalProductPrice, { color: theme.textSecondary }]}>{product.price} $</Text>
              
              <View style={[styles.quantityContainer, { backgroundColor: theme.bg, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.quantityLabel, { color: theme.textPrimary }]}>{t.modalQuantity}</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={styles.counterBtn} 
                    onPress={() => setQuantity(prev => Math.min(product.quantityInStock, prev + 1))}
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
                <Text style={styles.totalPrice}>{(product.price * quantity).toFixed(2)} $</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
  },
  imageContainer: {
    width: width,
    height: 300,
    borderBottomWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '90%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
    alignItems: 'flex-end',
  },
  categoryBadge: {
    color: '#C5A880',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  price: {
    color: '#C5A880',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  featuresRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    color: '#A0A0A0',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  descTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  descContent: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: 'row-reverse',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
  },
  stockLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  stockValue: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
  },
  outOfStockText: {
    color: '#FF5252',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bookBtn: {
    backgroundColor: '#C5A880',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBookBtn: {
    backgroundColor: '#333333',
  },
  bookBtnText: {
    color: '#121212',
    fontSize: 16,
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
