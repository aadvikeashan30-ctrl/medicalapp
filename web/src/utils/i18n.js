/**
 * Lightweight i18n (internationalization) for patient-facing pages
 * Supports: English (en), Hindi (hi)
 * 
 * Usage:
 *   import { useTranslation } from '../utils/i18n';
 *   const { t, lang, setLang } = useTranslation();
 *   <h1>{t('findDoctor')}</h1>
 */
import { useState, useEffect, createContext, useContext } from 'react';

const translations = {
  en: {
    // Common
    appName: 'DocClinic Pro',
    login: 'Doctor Login',
    register: 'Register',
    search: 'Search',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    
    // Landing Page
    heroTitle: 'Healthcare Made Simple',
    heroSubtitle: 'Find trusted doctors, book instantly, consult via video, and manage your health — all in one platform.',
    findDoctor: 'Find a Doctor',
    checkSymptoms: 'Check Symptoms Free',
    forPatients: 'For Patients',
    forDoctors: 'For Doctors',
    howItWorks: 'How It Works',
    
    // Find Doctor
    findRightDoctor: 'Find the Right Doctor',
    searchPlaceholder: 'Search doctor name, clinic, or specialty...',
    city: 'City',
    allSpecialties: 'All Specialties',
    topRated: 'Top Rated',
    feeLowToHigh: 'Fee: Low to High',
    feeHighToLow: 'Fee: High to Low',
    mostExperienced: 'Most Experienced',
    bookNow: 'Book Now',
    profile: 'Profile',
    reviews: 'reviews',
    consultationFee: 'Consultation Fee',
    yearsExperience: 'years experience',
    doctorsFound: 'doctors found',
    noDoctorsFound: 'No doctors found',
    
    // Booking
    bookAppointment: 'Book Appointment',
    selectDateTime: 'Select Date & Time',
    availableSlots: 'Available Slots',
    noSlots: 'No slots. Try another date.',
    visitType: 'Visit Type',
    consultation: 'Consultation',
    followUp: 'Follow-up',
    emergency: 'Emergency',
    checkup: 'Health Checkup',
    inPerson: 'In-Person',
    videoCall: 'Video Call',
    yourDetails: 'Your Details',
    fullName: 'Full Name',
    phone: 'Phone',
    email: 'Email',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    symptoms: 'Symptoms',
    confirmBooking: 'Confirm Booking',
    bookingConfirmed: 'Appointment Booked!',
    arriveEarly: 'Arrive 10 min early',
    
    // Payment
    completePayment: 'Complete Payment',
    payOnline: 'Pay Online',
    payAtClinic: 'Pay at Clinic (Cash/UPI)',
    paymentSuccess: 'Payment Successful!',
    
    // Symptom Checker
    aiSymptomChecker: 'AI Symptom Checker',
    describeSymptoms: 'Describe your symptoms',
    checkMySymptoms: 'Check My Symptoms',
    analyzing: 'Analyzing symptoms...',
    urgencyLevel: 'Urgency Level',
    possibleConditions: 'Possible Conditions',
    homeCare: 'Home Care',
    recommendedAction: 'Recommended Action',
    
    // Queue Tracking
    trackAppointment: 'Track Appointment',
    yourPosition: 'Your Position',
    estimatedWait: 'Estimated Wait',
    minutes: 'minutes',
    patientsAhead: 'patients ahead',
    yourTurn: 'Your Turn!',
    
    // OTP
    verifyPhone: 'Verify Your Phone',
    enterPhone: 'Enter your registered phone number',
    sendOTP: 'Send OTP',
    enterOTP: 'Enter the 6-digit code',
    verifyOTP: 'Verify OTP',
    resendOTP: 'Resend OTP',
    verified: 'Verified!',
    
    // Specialties
    generalPhysician: 'General Physician',
    dentist: 'Dentist',
    eyeSpecialist: 'Eye Specialist',
    orthopedic: 'Orthopedic',
    pediatrician: 'Pediatrician',
    dermatologist: 'Dermatologist',
    ent: 'ENT',
    cardiologist: 'Cardiologist',
    gynecologist: 'Gynecologist'
  },
  
  hi: {
    // Common
    appName: 'डॉकक्लिनिक प्रो',
    login: 'डॉक्टर लॉगिन',
    register: 'रजिस्टर',
    search: 'खोजें',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    loading: 'लोड हो रहा है...',
    back: 'वापस',
    next: 'आगे',
    done: 'हो गया',
    
    // Landing Page
    heroTitle: 'स्वास्थ्य सेवा अब आसान',
    heroSubtitle: 'भरोसेमंद डॉक्टर खोजें, तुरंत बुक करें, वीडियो पर सलाह लें — सब एक प्लेटफॉर्म पर।',
    findDoctor: 'डॉक्टर खोजें',
    checkSymptoms: 'लक्षण जांचें (मुफ्त)',
    forPatients: 'मरीजों के लिए',
    forDoctors: 'डॉक्टरों के लिए',
    howItWorks: 'कैसे काम करता है',
    
    // Find Doctor
    findRightDoctor: 'सही डॉक्टर खोजें',
    searchPlaceholder: 'डॉक्टर का नाम, क्लिनिक, या विशेषज्ञता खोजें...',
    city: 'शहर',
    allSpecialties: 'सभी विशेषज्ञता',
    topRated: 'सबसे अच्छी रेटिंग',
    feeLowToHigh: 'फीस: कम से ज्यादा',
    feeHighToLow: 'फीस: ज्यादा से कम',
    mostExperienced: 'सबसे अनुभवी',
    bookNow: 'अभी बुक करें',
    profile: 'प्रोफाइल',
    reviews: 'समीक्षाएं',
    consultationFee: 'परामर्श शुल्क',
    yearsExperience: 'साल का अनुभव',
    doctorsFound: 'डॉक्टर मिले',
    noDoctorsFound: 'कोई डॉक्टर नहीं मिला',
    
    // Booking
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    selectDateTime: 'तारीख और समय चुनें',
    availableSlots: 'उपलब्ध स्लॉट',
    noSlots: 'कोई स्लॉट नहीं। दूसरी तारीख चुनें।',
    visitType: 'विजिट का प्रकार',
    consultation: 'परामर्श',
    followUp: 'फॉलो-अप',
    emergency: 'आपातकालीन',
    checkup: 'स्वास्थ्य जांच',
    inPerson: 'क्लिनिक में',
    videoCall: 'वीडियो कॉल',
    yourDetails: 'आपकी जानकारी',
    fullName: 'पूरा नाम',
    phone: 'फोन',
    email: 'ईमेल',
    age: 'उम्र',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    symptoms: 'लक्षण',
    confirmBooking: 'बुकिंग पक्का करें',
    bookingConfirmed: 'अपॉइंटमेंट बुक हो गई!',
    arriveEarly: '10 मिनट पहले पहुंचें',
    
    // Payment
    completePayment: 'भुगतान पूरा करें',
    payOnline: 'ऑनलाइन भुगतान करें',
    payAtClinic: 'क्लिनिक में भुगतान (नकद/UPI)',
    paymentSuccess: 'भुगतान सफल!',
    
    // Symptom Checker
    aiSymptomChecker: 'AI लक्षण जांच',
    describeSymptoms: 'अपने लक्षण बताएं',
    checkMySymptoms: 'मेरे लक्षण जांचें',
    analyzing: 'लक्षणों का विश्लेषण...',
    urgencyLevel: 'तात्कालिकता स्तर',
    possibleConditions: 'संभावित स्थितियां',
    homeCare: 'घरेलू देखभाल',
    recommendedAction: 'सुझाई गई कार्रवाई',
    
    // Queue Tracking
    trackAppointment: 'अपॉइंटमेंट ट्रैक करें',
    yourPosition: 'आपकी स्थिति',
    estimatedWait: 'अनुमानित प्रतीक्षा',
    minutes: 'मिनट',
    patientsAhead: 'मरीज आगे',
    yourTurn: 'आपकी बारी!',
    
    // OTP
    verifyPhone: 'फोन सत्यापित करें',
    enterPhone: 'अपना रजिस्टर्ड फोन नंबर दर्ज करें',
    sendOTP: 'OTP भेजें',
    enterOTP: '6-अंकों का कोड दर्ज करें',
    verifyOTP: 'OTP सत्यापित करें',
    resendOTP: 'OTP दोबारा भेजें',
    verified: 'सत्यापित!',
    
    // Specialties
    generalPhysician: 'जनरल फिजिशियन',
    dentist: 'दंत चिकित्सक',
    eyeSpecialist: 'नेत्र विशेषज्ञ',
    orthopedic: 'हड्डी रोग विशेषज्ञ',
    pediatrician: 'बाल रोग विशेषज्ञ',
    dermatologist: 'त्वचा विशेषज्ञ',
    ent: 'कान-नाक-गला',
    cardiologist: 'हृदय रोग विशेषज्ञ',
    gynecologist: 'स्त्री रोग विशेषज्ञ'
  }
};

// Language context
const I18nContext = createContext(null);

/**
 * Get stored language preference
 */
function getStoredLang() {
  try {
    return localStorage.getItem('lang') || 'en';
  } catch {
    return 'en';
  }
}

/**
 * I18n Provider component
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.lang = newLang;
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang, translations: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useTranslation hook
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback when not wrapped in provider
    return {
      t: (key) => translations.en[key] || key,
      lang: 'en',
      setLang: () => {},
      translations: translations.en
    };
  }
  return context;
}

/**
 * Language Switcher component
 */
export function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useTranslation();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
        lang === 'hi'
          ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
      } ${className}`}
      title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
    >
      {lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
    </button>
  );
}

export default translations;
