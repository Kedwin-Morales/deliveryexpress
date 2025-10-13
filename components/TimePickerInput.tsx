import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface TimePickerInputProps {
  label: string;
  value: string; // formato "h:mm A" (ej: "2:00 PM")
  onChange: (value: string) => void;
}

const formatTo12Hour = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${hour12}:${paddedMinutes} ${period}`;
};

const TimePickerInput: React.FC<TimePickerInputProps> = ({
  label,
  value,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);

  const showPicker = () => setVisible(true);
  const hidePicker = () => setVisible(false);

  const handleConfirm = (date: Date) => {
    const formattedTime = formatTo12Hour(date); // "2:00 PM"
    onChange(formattedTime);
    hidePicker();
  };

  return (
    <View className="w-full mb-4">
      <Text className="font-bold mb-1">{label}</Text>
      <TouchableOpacity
        className="bg-gray-200 rounded-lg px-4 py-3"
        onPress={showPicker}
      >
        <Text className='text-bold text-gray-800'>{value || 'Selecciona una hora'}</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={visible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        locale="es_ES"
        is24Hour={false} // muestra el reloj en 12h para mayor claridad
      />
    </View>
  );
};

export default TimePickerInput;
