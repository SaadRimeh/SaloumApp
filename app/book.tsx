import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Schedule, AvailableSlot } from '../utils/api';
import { useAppContext } from '../utils/ThemeContext';

interface DayItem {
  dateString: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  rawDate: Date;
}

export default function BookScreen() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { theme, isArabic, isDark } = useAppContext();

  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<DayItem | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const duration = 60; // Default 60 mins
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  const t = {
    sec1Title: isArabic ? '1. اختر تاريخ الموعد' : '1. Choose Appointment Date',
    sec2Title: isArabic ? '2. باقة الخدمة والمدة' : '2. Service Package & Duration',
    royalCareTitle: isArabic ? 'العناية الملكية الكاملة' : 'Full Royal Care',
    royalCareTime: isArabic ? '60 دقيقة' : '60 Minutes',
    sec3Title: isArabic ? '3. اختر وقت الموعد' : '3. Choose Appointment Time',
    summaryTitle: isArabic ? 'ملخص الحجز' : 'Booking Summary',
    serviceLabel: isArabic ? 'الخدمة:' : 'Service:',
    serviceVal: isArabic ? 'جلسة حلاقة مميزة' : 'Premium Haircut Session',
    dateLabel: isArabic ? 'التاريخ:' : 'Date:',
    timeLabel: isArabic ? 'الوقت:' : 'Time:',
    durationLabel: isArabic ? 'المدة:' : 'Duration:',
    durationVal: isArabic ? '60 دقيقة' : '60 minutes',
    confirmBtn: isArabic ? 'تأكيد الحجز' : 'Confirm Booking',
    
    alertTitle: isArabic ? 'تنبيه' : 'Alert',
    alertChooseDate: isArabic ? 'يرجى اختيار تاريخ الموعد' : 'Please choose appointment date',
    alertChooseTime: isArabic ? 'يرجى اختيار وقت الموعد' : 'Please choose appointment time',
    alertLoginRequired: isArabic ? 'يجب تسجيل الدخول للحجز' : 'You must login to book',
    
    successTitle: isArabic ? 'تم الحجز بنجاح' : 'Booking Successful',
    successMsg: isArabic 
      ? 'يسعدنا استقبالك في صالون سلوم. تم تسجيل حجزك وسيتم تأكيده فوراً.'
      : 'We look forward to welcoming you to Salloum Salon. Your booking has been registered and will be confirmed shortly.',
    successOk: isArabic ? 'موافق' : 'OK',
    
    errorTitle: isArabic ? 'خطأ' : 'Error',
    errorMsg: isArabic 
      ? 'حدث خطأ أثناء حجز الموعد. يرجى اختيار موعد آخر.'
      : 'An error occurred while booking. Please choose another time.',
      
    loginRequiredTitle: isArabic ? 'حجز موعد جديد' : 'Book New Appointment',
    loginRequiredSubtitle: isArabic 
      ? 'يرجى تسجيل الدخول لعرض الأوقات المتاحة وتأكيد حجزك في صالون سلوم'
      : 'Please login to view available times and confirm your booking at Salloum Salon',
    loginBtnText: isArabic ? 'تسجيل الدخول' : 'Login',
    
    noSlots: isArabic ? 'لا توجد مواعيد متاحة في هذا اليوم' : 'No available appointments on this day',
    loadError: isArabic ? 'فشل تحميل المواعيد المتاحة. يرجى المحاولة لاحقاً.' : 'Failed to load available appointments. Please try again later.'
  };

  const generateNext7Days = () => {
    const nextDays: DayItem[] = [];
    const dayNames = isArabic 
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = isArabic
      ? ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      nextDays.push({
        dateString: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthName: months[d.getMonth()],
        rawDate: d
      });
    }
    setDays(nextDays);
    setSelectedDate(nextDays[0]); // Select today by default
  };

  const fetchSchedules = async (weekDate?: string) => {
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const token = await getToken();
      if (token) {
        const data = await api.getAvailableSlots(token, weekDate);
        setSchedules(data);
      }
    } catch (err: any) {
      console.warn('Schedules endpoint failed:', err.message);
      setSchedulesError(t.loadError);
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    generateNext7Days();
    if (isSignedIn) {
      fetchSchedules();
    } else {
      setSchedulesLoading(false);
    }
  }, [isSignedIn, isArabic]);

  // When user picks a date in a different week, re-fetch slots for that week
  const handleDateSelect = (item: DayItem) => {
    setSelectedDate(item);
    setSelectedTime('');
    if (isSignedIn) {
      fetchSchedules(item.dateString);
    }
  };

  // Get backend slots for the currently selected day, if any
  const getSlotsForSelectedDate = (): { time: string; label: string }[] | null => {
    if (!selectedDate || schedules.length === 0) return null;
    const daySchedule = schedules.find(s => s.date === selectedDate.dateString);
    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) return null;
    return daySchedule.slots.map((slot: AvailableSlot) => {
      const date = new Date(slot.start);
      let h = date.getHours();
      const m = date.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
      h = h % 12 || 12;
      return {
        time: `${date.getHours().toString().padStart(2, '0')}:${m}`,
        label: `${h}:${m} ${ampm}`,
      };
    });
  };

  const activeSlots = getSlotsForSelectedDate() ?? [];

  const handleBooking = async () => {
    if (!selectedDate) {
      Alert.alert(t.alertTitle, t.alertChooseDate);
      return;
    }
    if (!selectedTime) {
      Alert.alert(t.alertTitle, t.alertChooseTime);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(t.alertTitle, t.alertLoginRequired);
        router.push('/(auth)/login');
        return;
      }

      // Combine selectedDate and selectedTime into a local date then to ISO
      const dateObj = new Date(selectedDate.rawDate);
      const [hours, minutes] = selectedTime.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const requestedStart = dateObj.toISOString();

      await api.bookAppointment(token, requestedStart, duration);
      
      Alert.alert(
        t.successTitle,
        t.successMsg,
        [
          { 
            text: t.successOk, 
            onPress: () => {
              router.replace('/(tabs)/appointments');
            } 
          }
        ]
      );
    } catch (err: any) {
      console.warn('Booking error:', err);
      Alert.alert(t.errorTitle, err.message || t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C5A880" />
      </View>
    );
  }

  if (isLoaded && !isSignedIn) {
    return (
      <View style={[styles.loginPromptContainer, { backgroundColor: theme.bg }]}>
        <Ionicons name="calendar-outline" size={80} color="#C5A880" style={{ marginBottom: 20 }} />
        <Text style={[styles.loginPromptTitle, { color: theme.textPrimary }]}>{t.loginRequiredTitle}</Text>
        <Text style={[styles.loginPromptSubtitle, { color: theme.textSecondary }]}>
          {t.loginRequiredSubtitle}
        </Text>
        <TouchableOpacity 
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <Text style={styles.loginBtnText}>{t.loginBtnText}</Text>
            <Ionicons name="log-in-outline" size={20} color="#121212" style={isArabic ? { marginRight: 8 } : { marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scrollContent}>
      {/* 1. Date Selector */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.sec1Title}</Text>
          <Ionicons name="calendar-outline" size={18} color="#C5A880" />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dateList}
        >
          {days.map((item) => {
            const isSelected = selectedDate?.dateString === item.dateString;
            return (
              <TouchableOpacity
                key={item.dateString}
                style={[
                  styles.dateCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && styles.selectedDateCard
                ]}
                onPress={() => handleDateSelect(item)}
              >
                <Text style={[styles.dayName, { color: theme.textSecondary }, isSelected && styles.selectedText]}>{item.dayName}</Text>
                <Text style={[styles.dayNum, { color: theme.textPrimary }, isSelected && styles.selectedTextGold]}>{item.dayNum}</Text>
                <Text style={[styles.monthName, { color: theme.textSecondary }, isSelected && styles.selectedText]}>{item.monthName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Service & Duration Details */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.sec2Title}</Text>
          <Ionicons name="cut-outline" size={18} color="#C5A880" />
        </View>

        <View style={[styles.singleDurationCard, { backgroundColor: theme.card, borderColor: '#C5A880' }]}>
          <Ionicons name="diamond-outline" size={24} color="#C5A880" style={{ marginBottom: 6 }} />
          <Text style={styles.durationTitleGold}>{t.royalCareTitle}</Text>
          <Text style={[styles.durationTime, { color: theme.textPrimary }]}>{t.royalCareTime}</Text>
        </View>
      </View>

      {/* 3. Time Slots */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.sec3Title}</Text>
          <Ionicons name="time-outline" size={18} color="#C5A880" />
        </View>

        <View style={[styles.timeGrid, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          {schedulesLoading ? (
            <ActivityIndicator size="small" color="#C5A880" style={{ marginVertical: 20, alignSelf: 'center', width: '100%' }} />
          ) : schedulesError ? (
            <Text style={[styles.noSlotsText, { color: theme.textSecondary }]}>{schedulesError}</Text>
          ) : activeSlots.length > 0 ? (
            activeSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot, 
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && styles.selectedTimeSlot
                  ]}
                  onPress={() => setSelectedTime(slot.time)}
                >
                  <Text style={[styles.timeSlotText, { color: theme.textSecondary }, isSelected && styles.selectedTimeText]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={[styles.noSlotsText, { color: theme.textSecondary }]}>{t.noSlots}</Text>
          )}
        </View>
      </View>

      {/* 4. Booking Summary */}
      {selectedDate && selectedTime ? (
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { textAlign: isArabic ? 'right' : 'left' }]}>{t.summaryTitle}</Text>
          
          <View style={[styles.summaryRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.serviceLabel}</Text>
            <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>{t.serviceVal}</Text>
          </View>

          <View style={[styles.summaryRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.dateLabel}</Text>
            <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>{selectedDate.dayName}، {selectedDate.dayNum} {selectedDate.monthName}</Text>
          </View>

          <View style={[styles.summaryRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.timeLabel}</Text>
            <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
              {activeSlots.find(s => s.time === selectedTime)?.label || selectedTime}
            </Text>
          </View>

          <View style={[styles.summaryRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.durationLabel}</Text>
            <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>{t.durationVal}</Text>
          </View>
        </View>
      ) : null}

      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.bookBtn, 
          { 
            backgroundColor: (!selectedDate || !selectedTime) 
              ? (isDark ? '#333333' : '#E0E0E0') 
              : '#C5A880' 
          }
        ]}
        onPress={handleBooking}
        disabled={loading || !selectedDate || !selectedTime}
      >
        {loading ? (
          <ActivityIndicator color={isDark ? '#121212' : '#FFFFFF'} />
        ) : (
          <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <Text style={[
              styles.bookBtnText, 
              { 
                color: (!selectedDate || !selectedTime) 
                  ? '#888888' 
                  : '#121212' 
              }
            ]}>{t.confirmBtn}</Text>
            <Ionicons 
              name="checkmark-done" 
              size={20} 
              color={(!selectedDate || !selectedTime) ? '#888888' : '#121212'} 
              style={isArabic ? { marginRight: 8 } : { marginLeft: 8 }} 
            />
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateList: {
    flexDirection: 'row',
  },
  dateCard: {
    width: 80,
    height: 95,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedDateCard: {
    borderColor: '#C5A880',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
  },
  dayName: {
    fontSize: 11,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  monthName: {
    fontSize: 10,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedTextGold: {
    color: '#C5A880',
    fontWeight: 'bold',
  },
  singleDurationCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  durationTitleGold: {
    color: '#C5A880',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  durationTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
  },
  durationDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  timeGrid: {
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeSlot: {
    width: '23%',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  selectedTimeSlot: {
    borderColor: '#C5A880',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
  },
  timeSlotText: {
    fontSize: 12,
  },
  selectedTimeText: {
    color: '#C5A880',
    fontWeight: 'bold',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 168, 128, 0.2)',
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    color: '#C5A880',
    fontSize: 15,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  summaryRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 13,
  },
  summaryVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bookBtn: {
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
  bookBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSlotsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  loginPromptContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginPromptTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  loginBtn: {
    backgroundColor: '#C5A880',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowColor: '#C5A880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
