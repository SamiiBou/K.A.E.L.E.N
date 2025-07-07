// Utilitaire pour formater le temps selon la langue

interface TimeData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface TimeTranslations {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  day: string;
  days_plural: string;
  hour: string;
  hours_plural: string;
  minute: string;
  minutes_plural: string;
}

export function formatCountdownTime(
  timeData: TimeData, 
  t: (key: string) => string, 
  format: 'short' | 'long' = 'short'
): string {
  const { days, hours, minutes, seconds } = timeData;

  if (format === 'short') {
    // Format court : 6j 21h 59m
    return `${days}${t('time.days')} ${String(hours).padStart(2, '0')}${t('time.hours')} ${String(minutes).padStart(2, '0')}${t('time.minutes')}`;
  } else {
    // Format long : 6 jours, 21 heures, 59 minutes
    const parts: string[] = [];
    
    if (days > 0) {
      const dayUnit = days === 1 ? t('time.day') : t('time.days_plural');
      parts.push(`${days} ${dayUnit}`);
    }
    
    if (hours > 0) {
      const hourUnit = hours === 1 ? t('time.hour') : t('time.hours_plural');
      parts.push(`${hours} ${hourUnit}`);
    }
    
    if (minutes > 0) {
      const minuteUnit = minutes === 1 ? t('time.minute') : t('time.minutes_plural');
      parts.push(`${minutes} ${minuteUnit}`);
    }
    
    // Si tout est à 0, afficher "0 minutes"
    if (parts.length === 0) {
      parts.push(`0 ${t('time.minutes_plural')}`);
    }
    
    return parts.join(', ');
  }
}

// Fonction pour formater selon la langue avec détection automatique
export function formatTimeForLanguage(
  timeData: TimeData,
  language: string,
  format: 'short' | 'long' = 'short'
): string {
  const { days, hours, minutes } = timeData;

  // Fonction helper pour créer le format court selon la langue
  const createShortFormat = (dayUnit: string, hourUnit: string, minuteUnit: string) => {
    return `${days}${dayUnit} ${String(hours).padStart(2, '0')}${hourUnit} ${String(minutes).padStart(2, '0')}${minuteUnit}`;
  };

  // Fonction helper pour créer le format long selon la langue
  const createLongFormat = (
    dayWord: string, 
    dayWordPlural: string,
    hourWord: string, 
    hourWordPlural: string,
    minuteWord: string, 
    minuteWordPlural: string
  ) => {
    const parts: string[] = [];
    
    if (days > 0) {
      const dayUnit = days === 1 ? dayWord : dayWordPlural;
      parts.push(`${days} ${dayUnit}`);
    }
    
    if (hours > 0) {
      const hourUnit = hours === 1 ? hourWord : hourWordPlural;
      parts.push(`${hours} ${hourUnit}`);
    }
    
    if (minutes > 0) {
      const minuteUnit = minutes === 1 ? minuteWord : minuteWordPlural;
      parts.push(`${minutes} ${minuteUnit}`);
    }
    
    if (parts.length === 0) {
      parts.push(`0 ${minuteWordPlural}`);
    }
    
    return parts.join(', ');
  };

  switch (language) {
    case 'fr':
      return format === 'short' 
        ? createShortFormat('j', 'h', 'm')
        : createLongFormat('jour', 'jours', 'heure', 'heures', 'minute', 'minutes');
    
    case 'es':
      return format === 'short'
        ? createShortFormat('d', 'h', 'm')
        : createLongFormat('día', 'días', 'hora', 'horas', 'minuto', 'minutos');
    
    case 'id':
      return format === 'short'
        ? createShortFormat('h', 'j', 'm')
        : createLongFormat('hari', 'hari', 'jam', 'jam', 'menit', 'menit');
    
    case 'th':
      return format === 'short'
        ? createShortFormat('วัน', 'ชม.', 'น.')
        : createLongFormat('วัน', 'วัน', 'ชั่วโมง', 'ชั่วโมง', 'นาที', 'นาที');
    
    default: // English
      return format === 'short'
        ? createShortFormat('d', 'h', 'm')
        : createLongFormat('day', 'days', 'hour', 'hours', 'minute', 'minutes');
  }
}

// Exemples d'utilisation pour référence :
/*
FR: 6j 21h 59m | 6 jours, 21 heures, 59 minutes
EN: 6d 21h 59m | 6 days, 21 hours, 59 minutes  
ES: 6d 21h 59m | 6 días, 21 horas, 59 minutos
ID: 6h 21j 59m | 6 hari, 21 jam, 59 menit
TH: 6วัน 21ชม. 59น. | 6 วัน, 21 ชั่วโมง, 59 นาที
*/