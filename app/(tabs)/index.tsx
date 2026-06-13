import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Modal,
  Switch,
  Alert
} from 'react-native';
import { useUser, useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Item } from '../../utils/api';
import { useAppContext } from '../../utils/ThemeContext';

export default function HomeScreen() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { isDark, setIsDark, isArabic, setIsArabic, theme } = useAppContext();

  // Translations
  const t = {
    welcome: isArabic ? 'مرحباً بك في صالون سلوم' : 'Welcome to Salloum Salon',
    guest: isArabic ? 'عميلنا العزيز' : 'Dear Guest',
    bannerTitle: isArabic ? 'تألق بمظهرك الفريد' : 'Shine With Your Look',
    bannerSubtitle: isArabic ? 'حيث تلتقي الأناقة العصرية بالفخامة الكلاسيكية' : 'Where modern elegance meets classic luxury',
    bookBtn: isArabic ? 'حجز موعد جديد' : 'Book New Appointment',
    salonLocation: isArabic ? 'موقع صالون سلوم' : 'Salloum Salon Location',
    locationDesc: isArabic ? 'اللاذقية , جناتا جانب الملعب' : 'Latakia, Janata, near stadium',
    perfumes: isArabic ? 'عطورات' : 'Perfumes',
    noData: isArabic ? 'لا توجد خدمات متاحة حالياً' : 'No services available currently',
    error: isArabic ? 'فشل تحميل الخدمات. يرجى المحاولة لاحقاً' : 'Failed to load services. Please try again',
    footer: isArabic ? 'صالون سلوم يضمن لك تجربة استثنائية وعناية تفوق التوقعات' : 'Salloum Salon guarantees an exceptional experience',
    settingsTitle: isArabic ? 'الإعدادات' : 'Settings',
    darkMode: isArabic ? 'الوضع الليلي' : 'Dark Mode',
    lang: isArabic ? 'اللغة العربية' : 'Arabic Language',
    logout: isArabic ? 'تسجيل الخروج' : 'Logout',
    deleteAcc: isArabic ? 'حذف الحساب' : 'Delete Account',
    logoutConfirm: isArabic ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
    deleteConfirm: isArabic ? 'هل أنت متأكد من حذف الحساب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Are you sure you want to permanently delete your account? This cannot be undone.',
    cancel: isArabic ? 'إلغاء' : 'Cancel',
    confirm: isArabic ? 'تأكيد' : 'Confirm',
    deleteErr: isArabic ? 'فشل حذف الحساب' : 'Failed to delete account'
  };

  const loadData = async () => {
    try {
      setError('');
      const fetchedItems = await api.getItems();
      setItems(fetchedItems);
    } catch (err: any) {
      console.warn('Load index data error:', err);
      setError(t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isArabic]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGenderInfo = (gender: string) => {
    const g = gender?.toLowerCase() || '';
    if (g === 'male' || g === 'men') {
      return { text: isArabic ? 'رجالي' : 'Men', icon: 'male-outline' as const, color: '#6A92D4' };
    } else if (g === 'female' || g === 'women') {
      return { text: isArabic ? 'نسواني' : 'Women', icon: 'female-outline' as const, color: '#D46A92' };
    } else {
      return { text: isArabic ? 'نسواني ورجالي' : 'Unisex', icon: 'male-female-outline' as const, color: '#C5A880' };
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.deleteAcc,
      t.deleteConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.confirm, 
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await user.delete();
                setSettingsVisible(false);
                router.replace('/(auth)/login');
              }
            } catch (error) {
              Alert.alert('Error', t.deleteErr);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout,
      t.logoutConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.confirm, 
          style: 'destructive',
          onPress: async () => {
            setSettingsVisible(false);
            await signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const renderServiceCard = ({ item }: { item: Item }) => {
    const genderInfo = getGenderInfo(item.gender);
    return (
      <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.serviceIconContainer}>
          <Ionicons name="flask-outline" size={24} color="#C5A880" />
        </View>
        <Text style={[styles.serviceName, { color: theme.textPrimary }]}>{item.name.toUpperCase()}</Text>
        <View style={styles.genderBadge}>
          <Text style={[styles.genderText, { color: genderInfo.color }]}>
            {genderInfo.text}
          </Text>
          <Ionicons name={genderInfo.icon} size={12} color={genderInfo.color} style={{ marginLeft: 4 }} />
        </View>
        <Text style={styles.servicePrice}>{item.price} $</Text>
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.bg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A880" />
      }
    >
      {/* Top Welcome Bar */}
      <View style={[styles.header, !isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color="#C5A880" />
          </TouchableOpacity>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={20} color="#121212" />
            </View>
          )}
        </View>
        <View style={[styles.headerRight, !isArabic && { alignItems: 'flex-start' }]}>
          <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>{t.welcome}</Text>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{user?.firstName || user?.username || t.guest}</Text>
        </View>
      </View>

      {/* Hero Banner */}
      <ImageBackground
        source={require('../../assets/images/barbershop_bg.png')}
        style={styles.banner}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.bannerOverlay} />
        <Text style={styles.bannerTitle}>{t.bannerTitle}</Text>
        <Text style={styles.bannerSubtitle}>{t.bannerSubtitle}</Text>
        
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push('/book')}
        >
          <Ionicons name="calendar-sharp" size={18} color="#121212" style={{ marginRight: 8 }} />
          <Text style={styles.bookButtonText}>{t.bookBtn}</Text>
        </TouchableOpacity>
      </ImageBackground>

      {/* Work Hours & Info */}
      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          <Ionicons name="location-outline" size={24} color="#C5A880" />
          <View style={[styles.infoTextContainer, isArabic ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10, alignItems: 'flex-start' }]}>
            <Text style={styles.infoTitle}>{t.salonLocation}</Text>
            <Text style={[styles.infoDesc, { color: theme.textPrimary }]}>{t.locationDesc}</Text>
          </View>
        </View>
      </View>

      {/* Services List */}
      <View style={styles.servicesSection}>
        <View style={[styles.sectionHeader, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginRight: isArabic ? 6 : 0, marginLeft: !isArabic ? 6 : 0 }]}>{t.perfumes}</Text>
          <Ionicons name="flask" size={18} color="#C5A880" />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#C5A880" style={{ marginVertical: 30 }} />
        ) : error ? (
          <Text style={styles.errorText}>{t.error}</Text>
        ) : items.length === 0 ? (
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>{t.noData}</Text>
        ) : (
          <FlatList
            data={items}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            inverted={isArabic}
            contentContainerStyle={styles.servicesList}
          />
        )}
      </View>

      {/* Luxury Message */}
      <View style={styles.brandFooter}>
        <Ionicons name="ribbon-outline" size={32} color="rgba(197, 168, 128, 0.4)" />
        <Text style={[styles.brandFooterText, { color: theme.textSecondary }]}>{t.footer}</Text>
      </View>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="fade" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
              <Text style={styles.modalTitle}>{t.settingsTitle}</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color="#C5A880" />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingRow, { flexDirection: isArabic ? 'row-reverse' : 'row', borderBottomColor: theme.border }]}>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t.darkMode}</Text>
              <Switch 
                value={isDark} 
                onValueChange={setIsDark}
                trackColor={{ false: "#767577", true: "#C5A880" }}
                thumbColor={"#f4f3f4"}
              />
            </View>

            <View style={[styles.settingRow, { flexDirection: isArabic ? 'row-reverse' : 'row', borderBottomColor: theme.border }]}>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t.lang}</Text>
              <Switch 
                value={isArabic} 
                onValueChange={setIsArabic}
                trackColor={{ false: "#767577", true: "#C5A880" }}
                thumbColor={"#f4f3f4"}
              />
            </View>

            <TouchableOpacity 
              style={[styles.settingButton, { flexDirection: isArabic ? 'row-reverse' : 'row' }]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#121212" style={isArabic ? {marginRight: 8} : {marginLeft: 8}} />
              <Text style={styles.settingButtonText}>{t.logout}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingButton, styles.deleteButton, { flexDirection: isArabic ? 'row-reverse' : 'row' }]} 
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#FF5252" style={isArabic ? {marginRight: 8} : {marginLeft: 8}} />
              <Text style={styles.settingButtonTextDelete}>{t.deleteAcc}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginHorizontal: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#C5A880',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#C5A880',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 13,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  banner: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.3)',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#C5A880',
    marginTop: 6,
    textAlign: 'center',
    zIndex: 1,
    opacity: 0.9,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: '#C5A880',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 18,
    zIndex: 1,
    alignItems: 'center',
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  bookButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: '#C5A880',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoDesc: {
    fontSize: 10,
    marginTop: 4,
  },
  servicesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  servicesList: {
    paddingHorizontal: 4,
  },
  serviceCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 7,
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(197, 168, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197,168,128,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  servicePrice: {
    color: '#C5A880',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginVertical: 20,
  },
  noDataText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  brandFooter: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  brandFooterText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#C5A880',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
  },
  settingButton: {
    backgroundColor: '#C5A880',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  settingButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF5252',
    marginTop: 12,
  },
  settingButtonTextDelete: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
