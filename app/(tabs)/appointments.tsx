import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Appointment } from '../../utils/api';
import { useAppContext } from '../../utils/ThemeContext';

export default function AppointmentsScreen() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { theme, isArabic } = useAppContext();

  const t = {
    error: isArabic ? 'فشل تحميل قائمة الحجوزات. يرجى المحاولة لاحقاً' : 'Failed to load appointments. Please try again',
    cancelConfirmTitle: isArabic ? 'تأكيد الإلغاء' : 'Confirm Cancellation',
    cancelConfirmMsg: isArabic ? 'هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to cancel this appointment? This action cannot be undone.',
    cancelBack: isArabic ? 'تراجع' : 'Back',
    cancelYes: isArabic ? 'نعم، إلغاء الحجز' : 'Yes, cancel appointment',
    cancelSuccessTitle: isArabic ? 'تم الإلغاء' : 'Cancelled',
    cancelSuccessMsg: isArabic ? 'تم إلغاء موعدك بنجاح' : 'Appointment cancelled successfully',
    cancelError: isArabic ? 'فشل إلغاء الموعد' : 'Failed to cancel appointment',
    statusPending: isArabic ? 'قيد الانتظار' : 'Pending',
    statusAccepted: isArabic ? 'مؤكد' : 'Accepted',
    statusRejected: isArabic ? 'مرفوض' : 'Rejected',
    statusCancelled: isArabic ? 'ملغي' : 'Cancelled',
    serviceTitle: isArabic ? 'جلسة حلاقة وتصفيف' : 'Haircut & Styling',
    endTime: isArabic ? 'وقت الانتهاء' : 'End Time',
    cancelBtn: isArabic ? 'إلغاء الموعد' : 'Cancel Appointment',
    tabPast: isArabic ? 'السابقة والملغاة' : 'Past & Cancelled',
    tabUpcoming: isArabic ? 'القادمة' : 'Upcoming',
    noApps: isArabic ? 'لا توجد مواعيد حالياً' : 'No appointments right now',
    noAppsUpcoming: isArabic ? 'ليس لديك أي مواعيد نشطة قادمة. ابدأ بحجز موعد الآن!' : 'You have no upcoming appointments. Book one now!',
    noAppsPast: isArabic ? 'سجل مواعيدك السابقة والملغاة يظهر هنا.' : 'Your past and cancelled appointments will appear here.',
    bookNow: isArabic ? 'احجز موعد الآن' : 'Book Now',
    rejectionReason: isArabic ? 'سبب الرفض' : 'Rejection Reason',
    sun: isArabic ? 'الأحد' : 'Sun',
    mon: isArabic ? 'الإثنين' : 'Mon',
    tue: isArabic ? 'الثلاثاء' : 'Tue',
    wed: isArabic ? 'الأربعاء' : 'Wed',
    thu: isArabic ? 'الخميس' : 'Thu',
    fri: isArabic ? 'الجمعة' : 'Fri',
    sat: isArabic ? 'السبت' : 'Sat',
    jan: isArabic ? 'كانون الثاني' : 'Jan', feb: isArabic ? 'شباط' : 'Feb', mar: isArabic ? 'آذار' : 'Mar', apr: isArabic ? 'نيسان' : 'Apr',
    may: isArabic ? 'أيار' : 'May', jun: isArabic ? 'حزيران' : 'Jun', jul: isArabic ? 'تموز' : 'Jul', aug: isArabic ? 'آب' : 'Aug',
    sep: isArabic ? 'أيلول' : 'Sep', oct: isArabic ? 'تشرين الأول' : 'Oct', nov: isArabic ? 'تشرين الثاني' : 'Nov', dec: isArabic ? 'كانون الأول' : 'Dec',
    am: isArabic ? 'صباحاً' : 'AM', pm: isArabic ? 'مساءً' : 'PM',
  };

  const loadAppointments = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await api.getMyAppointments(token);
      // Sort appointments by date: upcoming first, past last
      const sorted = [...data].sort((a, b) => 
        new Date(b.requestedStart).getTime() - new Date(a.requestedStart).getTime()
      );
      setAppointments(sorted);
    } catch (err: any) {
      console.warn('Load appointments error:', err);
      Alert.alert('Error', t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Helper to format date in beautiful Arabic
  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
    const months = [
      t.jan, t.feb, t.mar, t.apr, t.may, t.jun, 
      t.jul, t.aug, t.sep, t.oct, t.nov, t.dec
    ];
    
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? t.pm : t.am;
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    if (isArabic) {
      return `${dayName}، ${dayNum} ${monthName} ${year} | ${hours}:${minutes} ${ampm}`;
    } else {
      return `${dayName}, ${monthName} ${dayNum}, ${year} | ${hours}:${minutes} ${ampm}`;
    }
  };

  // Handle Cancellation
  const handleCancel = async (id: string) => {
    Alert.alert(
      t.cancelConfirmTitle,
      t.cancelConfirmMsg,
      [
        { text: t.cancelBack, style: 'cancel' },
        { 
          text: t.cancelYes, 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getToken();
              if (token) {
                await api.cancelAppointment(token, id);
                Alert.alert(t.cancelSuccessTitle, t.cancelSuccessMsg);
                loadAppointments();
              }
            } catch (err: any) {
              console.warn('Cancel appointment error:', err);
              Alert.alert('Error', err.message || t.cancelError);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filter appointments based on activeTab (upcoming vs past/cancelled/completed)
  const getFilteredAppointments = () => {
    const now = new Date().getTime();
    return appointments.filter(apt => {
      const isUpcomingTime = new Date(apt.requestedStart).getTime() > now;
      const isActiveStatus = apt.status === 'Pending' || apt.status === 'Accepted';
      
      if (activeTab === 'upcoming') {
        return isUpcomingTime && isActiveStatus;
      } else {
        return !isUpcomingTime || apt.status === 'Cancelled' || apt.status === 'Rejected';
      }
    });
  };

  const getStatusBadge = (status: string) => {
    let text = t.statusPending;
    let bgColor = 'rgba(255, 193, 7, 0.15)';
    let textColor = '#FFC107';
    let iconName: any = 'time-outline';

    if (status === 'Accepted') {
      text = t.statusAccepted;
      bgColor = 'rgba(76, 175, 80, 0.15)';
      textColor = '#4CAF50';
      iconName = 'checkmark-circle-outline';
    } else if (status === 'Cancelled') {
      text = t.statusCancelled;
      bgColor = 'rgba(244, 67, 54, 0.15)';
      textColor = '#F44336';
      iconName = 'close-circle-outline';
    } else if (status === 'Rejected') {
      text = t.statusRejected;
      bgColor = 'rgba(158, 82, 82, 0.15)';
      textColor = '#FF7043';
      iconName = 'ban-outline';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor, flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
        <Text style={[styles.statusText, { color: textColor }]}>{text}</Text>
        <Ionicons name={iconName} size={14} color={textColor} style={isArabic ? { marginLeft: 4 } : { marginRight: 4 }} />
      </View>
    );
  };

  const filteredData = getFilteredAppointments();

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const now = new Date().getTime();
    const isUpcoming = new Date(item.requestedStart).getTime() > now;
    const canCancel = (item.status === 'Pending' || item.status === 'Accepted') && isUpcoming;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.border, flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
          {getStatusBadge(item.status)}
          <View style={[styles.cardHeaderLeft, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
            <Ionicons name="cut-outline" size={18} color="#C5A880" />
            <Text style={[styles.serviceTitle, { color: theme.textPrimary }, isArabic ? { marginRight: 6 } : { marginLeft: 6 }]}>{t.serviceTitle}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.infoRow, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
            <Text style={[styles.infoText, { color: theme.textPrimary }]}>{formatAppointmentDate(item.requestedStart)}</Text>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={isArabic ? { marginLeft: 8 } : { marginRight: 8 }} />
          </View>

          <View style={[styles.infoRow, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
            <Text style={[styles.infoText, { color: theme.textPrimary }]}>{t.endTime}: {formatAppointmentDate(item.requestedEnd)}</Text>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} style={isArabic ? { marginLeft: 8 } : { marginRight: 8 }} />
          </View>
        </View>

        {/* Rejection reason — shown when the appointment is rejected */}
        {item.status === 'Rejected' && item.rejectionReason && (
          <View style={[styles.cancelReasonBox, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
            <Ionicons name="information-circle-outline" size={18} color="#FF5252" style={isArabic ? { marginLeft: 8 } : { marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cancelReasonTitle, { textAlign: isArabic ? 'right' : 'left' }]}>
                {t.rejectionReason}
              </Text>
              <Text style={[styles.cancelReasonText, { textAlign: isArabic ? 'right' : 'left' }]}>
                {item.rejectionReason}
              </Text>
            </View>
          </View>
        )}

        {canCancel && (
          <TouchableOpacity 
            style={[styles.cancelButton, { flexDirection: isArabic ? 'row' : 'row-reverse' }]}
            onPress={() => handleCancel(item._id)}
          >
            <Text style={styles.cancelButtonText}>{t.cancelBtn}</Text>
            <Ionicons name="close-outline" size={16} color="#FF5252" style={isArabic ? { marginRight: 4 } : { marginLeft: 4 }} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Tabs Toggles */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isArabic ? 'row' : 'row-reverse' }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>{t.tabPast}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>{t.tabUpcoming}</Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C5A880" />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-clear-outline" size={60} color={theme.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t.noApps}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {activeTab === 'upcoming' 
              ? t.noAppsUpcoming
              : t.noAppsPast}
          </Text>
          
          {activeTab === 'upcoming' && (
            <TouchableOpacity 
              style={styles.bookNowBtn}
              onPress={() => router.push('/book')}
            >
              <Text style={styles.bookNowBtnText}>{t.bookNow}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item._id}
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
  tabContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(197, 168, 128, 0.15)',
  },
  tabText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#C5A880',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardHeaderLeft: {
    alignItems: 'center',
  },
  serviceTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  cancelReasonBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  cancelReasonTitle: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cancelReasonText: {
    color: '#FF8A80',
    fontSize: 12,
    lineHeight: 18,
  },
  cancelButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bookNowBtn: {
    backgroundColor: '#C5A880',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bookNowBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
