/**
 * @component CustomDateRangePicker
 * @description Professional date range picker using react-native-calendars
 */

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X, Check } from 'lucide-react-native';
import { FONT_FAMILY } from '../utils/fontConfig';

interface CustomDateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  theme: {
    primary: string;
    background: string;
    text: string;
    cardBackground: string;
  };
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  visible,
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
  theme: { primary, background, text, cardBackground },
}) => {
  const [startDate, setStartDate] = useState<string | null>(
    initialStartDate ? initialStartDate.toISOString().split('T')[0] : null
  );
  const [endDate, setEndDate] = useState<string | null>(
    initialEndDate ? initialEndDate.toISOString().split('T')[0] : null
  );

  // Generate marked dates for calendar display
  const markedDates = useMemo(() => {
    const marked: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Mark all dates in range
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        marked[dateStr] = {
          color: primary,
          textColor: '#FFFFFF',
          startingDay: dateStr === startDate,
          endingDay: dateStr === endDate,
        };
        current.setDate(current.getDate() + 1);
      }
    } else if (startDate) {
      marked[startDate] = {
        color: primary,
        textColor: '#FFFFFF',
        startingDay: true,
        endingDay: true,
      };
    }

    return marked;
  }, [startDate, endDate, primary]);

  const handleDayPress = (day: any) => {
    if (!startDate) {
      setStartDate(day.dateString);
    } else if (!endDate) {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setEndDate(startDate);
      } else {
        setEndDate(day.dateString);
      }
    } else {
      setStartDate(day.dateString);
      setEndDate(null);
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(new Date(startDate), new Date(endDate));
    }
  };

  const getDayCount = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not selected';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingBottom: 40,
              // limit height so the sheet doesn't collapse; allow room for calendar
              maxHeight: '80%',
              height: '70%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#000000', fontFamily: FONT_FAMILY.proximanovaBlack }}>
                Select Date Range
              </Text>
              <Pressable onPress={onClose}>
                <X size={24} color="#000000" strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView
              // use flexGrow so ScrollView expands inside the sheet and provides space for the calendar
              contentContainerStyle={{ flexGrow: 1 }}
              style={{ marginBottom: 16 }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
            >
              {/* Calendar */}
              <View style={{ marginBottom: 16 }}>
                <Calendar
                  current={startDate || endDate || new Date().toISOString().split('T')[0]}
                  minDate={new Date(2025, 0, 1).toISOString().split('T')[0]}
                  maxDate={new Date(2027, 11, 31).toISOString().split('T')[0]}
                  onDayPress={handleDayPress}
                  markingType="period"
                  markedDates={markedDates}
                  theme={{
                    backgroundColor: '#FFFFFF',
                    calendarBackground: '#FFFFFF',
                    textSectionTitleColor: '#999999',
                    selectedDayBackgroundColor: primary,
                    selectedDayTextColor: '#FFFFFF',
                    todayTextColor: primary,
                    todayBackgroundColor: primary + '20',
                    dayTextColor: '#000000',
                    textDisabledColor: '#CCCCCC',
                    dotColor: primary,
                    selectedDotColor: '#FFFFFF',
                    arrowColor: primary,
                    disabledArrowColor: '#CCCCCC',
                    monthTextColor: '#000000',
                    indicatorColor: primary,
                    textDayFontFamily: 'System',
                    textMonthFontFamily: 'System',
                    textDayHeaderFontFamily: 'System',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 13,
                    textDayFontWeight: '500',
                    textMonthFontWeight: '700',
                    textDayHeaderFontWeight: '600',
                  }}
                  style={{
                    height: 360,
                    borderRadius: 12,
                    overflow: 'hidden',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                  }}
                />
              </View>

              {/* Date Selection Info */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    backgroundColor: '#F5F5F5',
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#E5E5E5',
                  }}
                >
                  <View style={{ marginBottom: 10 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#666666',
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      From
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000', fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
                      {formatDate(startDate)}
                    </Text>
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#666666',
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      To
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000', fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
                      {formatDate(endDate)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Date Range Summary */}
              {startDate && endDate && (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: primary + '15',
                    borderRadius: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: primary,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: primary, fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
                    {formatDate(startDate)} → {formatDate(endDate)}
                  </Text>
                                    <Text style={{ fontSize: 11, fontWeight: '500', color: primary, opacity: 0.7, marginTop: 4, fontFamily: FONT_FAMILY.proximaNova }}>
                    {getDayCount()} days selected
                  </Text>
                </View>
              )}

              {(!startDate || !endDate) && (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: '#FFF3CD',
                    borderRadius: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: '#FFC107',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#856404', fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
                    {!startDate ? 'Tap a date to start' : 'Tap another date to complete the range'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E5E5',
                  alignItems: 'center',
                  backgroundColor: '#F5F5F5',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#000000', fontFamily: FONT_FAMILY.proximaNovaBold }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleApply}
                disabled={!startDate || !endDate}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: startDate && endDate ? primary : '#CCCCCC',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', fontFamily: FONT_FAMILY.proximaNovaBold }}>
                  Apply
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
