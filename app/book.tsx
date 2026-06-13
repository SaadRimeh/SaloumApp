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
import { api, Schedule } from '../utils/api';

interface DayItem {
  dateString: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  rawDate: Date;
}

export default function BookScreen() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<DayItem | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60); // Default 60 mins
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  // Fallback default time slots if backend schedules are empty or 401
  const defaultTimeSlots = [
    { time: '10:00', label: '10:00 ص' },
    { time: '11:00', label: '11:00 ص' },
    { time: '12:00', label: '12:00 م' },
    { time: '13:00', label: '01:00 م' },
    { time: '14:00', label: '02:00 م' },
    { time: '15:00', label: '03:00 م' },
    { time: '16:00', label: '04:00 م' },
    { time: '17:00', label: '05:00 م' },
    { time: '18:00', label: '06:00 م' },
    { time: '19:00', label: '07:00 م' },
    { time: '20:00', label: '08:00 م' },
    { time: '21:00', label: '09:00 م' },
  ];

  const generateNext7Days = () => {
    const nextDays: DayItem[] = [];
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = [
      'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 
      'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
    ];
    
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

  const fetchSchedules = async () => {
    try {
      const token = await getToken();
      if (token) {
        const data = await api.getSchedules(token);
        setSchedules(data);
      }
    } catch (err: any) {
      console.warn('Schedules endpoint failed or unauthorized, using local defaults', err.message);
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    generateNext7Days();
    fetchSchedules();
  }, []);

  const handleBooking = async () => {
    if (!selectedDate) {
      Alert.alert('تنبيه', 'يرجى اختيار تاريخ الموعد');
      return;
    }
    if (!selectedTime) {
      Alert.alert('تنبيه', 'يرجى اختيار وقت الموعد');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('تنبيه', 'يجب تسجيل الدخول للحجز');
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
        'تم الحجز بنجاح',
        'يسعدنا استقبالك في صالون الفخامة. تم تسجيل حجزك وسيتم تأكيده فوراً.',
        [
          { 
            text: 'موافق', 
            onPress: () => {
              router.replace('/(tabs)/appointments');
            } 
          }
        ]
      );
    } catch (err: any) {
      console.warn('Booking error:', err);
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء حجز الموعد. يرجى اختيار موعد آخر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Date Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1. اختر تاريخ الموعد</Text>
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
                style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                onPress={() => setSelectedDate(item)}
              >
                <Text style={[styles.dayName, isSelected && styles.selectedText]}>{item.dayName}</Text>
                <Text style={[styles.dayNum, isSelected && styles.selectedTextGold]}>{item.dayNum}</Text>
                <Text style={[styles.monthName, isSelected && styles.selectedText]}>{item.monthName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Duration Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>2. اختر باقة الخدمة والمدة</Text>
          <Ionicons name="cut-outline" size={18} color="#C5A880" />
        </View>

        <View style={styles.durationRow}>
          <TouchableOpacity 
            style={[styles.durationCard, duration === 60 && styles.activeDurationCard]}
            onPress={() => setDuration(60)}
          >
            <Ionicons name="diamond-outline" size={24} color={duration === 60 ? '#C5A880' : '#888'} />
            <Text style={[styles.durationTitle, duration === 60 && styles.activeDurationText]}>العناية الملكية الكاملة</Text>
            <Text style={styles.durationTime}>60 دقيقة</Text>
            <Text style={styles.durationDesc}>شعر + لحية + سكراب للوجه + بخار</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.durationCard, duration === 30 && styles.activeDurationCard]}
            onPress={() => setDuration(30)}
          >
            <Ionicons name="cut-outline" size={24} color={duration === 30 ? '#C5A880' : '#888'} />
            <Text style={[styles.durationTitle, duration === 30 && styles.activeDurationText]}>حلاقة سريعة</Text>
            <Text style={styles.durationTime}>30 دقيقة</Text>
            <Text style={styles.durationDesc}>قص وتصفيف شعر أو تحديد لحية</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Time Slots */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>3. اختر وقت الموعد</Text>
          <Ionicons name="time-outline" size={18} color="#C5A880" />
        </View>

        <View style={styles.timeGrid}>
          {defaultTimeSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <TouchableOpacity
                key={slot.time}
                style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                onPress={() => setSelectedTime(slot.time)}
              >
                <Text style={[styles.timeSlotText, isSelected && styles.selectedTimeText]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Booking Summary */}
      {selectedDate && selectedTime ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص الحجز الفاخر</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryVal}>جلسة حلاقة مميزة</Text>
            <Text style={styles.summaryLabel}>الخدمة:</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryVal}>{selectedDate.dayName}، {selectedDate.dayNum} {selectedDate.monthName}</Text>
            <Text style={styles.summaryLabel}>التاريخ:</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryVal}>
              {defaultTimeSlots.find(s => s.time === selectedTime)?.label || selectedTime}
            </Text>
            <Text style={styles.summaryLabel}>الوقت:</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryVal}>{duration} دقيقة</Text>
            <Text style={styles.summaryLabel}>المدة:</Text>
          </View>
        </View>
      ) : null}

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.bookBtn, (!selectedDate || !selectedTime) && styles.disabledBookBtn]}
        onPress={handleBooking}
        disabled={loading || !selectedDate || !selectedTime}
      >
        {loading ? (
          <ActivityIndicator color="#121212" />
        ) : (
          <>
            <Text style={styles.bookBtnText}>تأكيد الحجز الفاخر</Text>
            <Ionicons name="checkmark-done" size={20} color="#121212" style={{ marginRight: 8 }} />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  dateList: {
    flexDirection: 'row',
  },
  dateCard: {
    backgroundColor: '#1E1E1E',
    width: 80,
    height: 95,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  selectedDateCard: {
    borderColor: '#C5A880',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
  },
  dayName: {
    color: '#888',
    fontSize: 11,
  },
  dayNum: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  monthName: {
    color: '#888',
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
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationCard: {
    flex: 0.48,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  activeDurationCard: {
    borderColor: '#C5A880',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
  },
  durationTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  activeDurationText: {
    color: '#C5A880',
  },
  durationTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  durationDesc: {
    color: '#888',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
  },
  timeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeSlot: {
    backgroundColor: '#1E1E1E',
    width: '23%',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  selectedTimeSlot: {
    borderColor: '#C5A880',
    backgroundColor: 'rgba(197, 168, 128, 0.12)',
  },
  timeSlotText: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  selectedTimeText: {
    color: '#C5A880',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
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
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
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
});
