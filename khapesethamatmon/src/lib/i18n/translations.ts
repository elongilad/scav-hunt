export interface Translations {
  [key: string]: string | Translations
}

export const translations: Record<string, Translations> = {
  he: {
    // Common
    common: {
      save: 'שמור',
      cancel: 'בטל',
      delete: 'מחק',
      edit: 'ערוך',
      create: 'צור',
      update: 'עדכן',
      loading: 'טוען...',
      error: 'שגיאה',
      success: 'הצלחה',
      warning: 'אזהרה',
      info: 'מידע',
      yes: 'כן',
      no: 'לא',
      ok: 'אישור',
      back: 'חזור',
      next: 'הבא',
      previous: 'הקודם',
      close: 'סגור',
      open: 'פתח',
      view: 'צפה',
      download: 'הורד',
      upload: 'העלה',
      search: 'חפש',
      filter: 'סנן',
      sort: 'מיין',
      refresh: 'רענן',
      home: 'בית',
      dashboard: 'דשבורד',
      settings: 'הגדרות',
      profile: 'פרופיל',
      logout: 'התנתק',
      login: 'התחבר',
      register: 'הרשם',
      name: 'שם',
      email: 'אימייל',
      password: 'סיסמה',
      phone: 'טלפון',
      address: 'כתובת',
      date: 'תאריך',
      time: 'שעה',
      status: 'סטטוס',
      active: 'פעיל',
      inactive: 'לא פעיל',
      pending: 'ממתין',
      completed: 'הושלם',
      draft: 'טיוטה',
      ready: 'מוכן'
    },

    // Navigation
    nav: {
      home: 'בית',
      dashboard: 'דשבורד',
      events: 'אירועים',
      models: 'מודלי ציד',
      templates: 'תבניות וידאו',
      stations: 'עמדות',
      missions: 'משימות',
      billing: 'תשלומים',
      admin: 'ניהול',
      play: 'שחק',
      help: 'עזרה',
      contact: 'צור קשר'
    },

    // Authentication
    auth: {
      welcomeBack: 'ברוכים השבים',
      loginDescription: 'התחברו למערכת ניהול ציד האוצרות',
      emailLabel: 'כתובת אימייל',
      emailPlaceholder: 'הזינו את כתובת האימייל שלכם',
      passwordLabel: 'סיסמה',
      passwordPlaceholder: 'הזינו את הסיסמה שלכם',
      loginButton: 'התחבר',
      loginWithGoogle: 'התחבר עם Google',
      forgotPassword: 'שכחתם סיסמה?',
      noAccount: 'אין לכם חשבון?',
      createAccount: 'צור חשבון',
      loggingIn: 'מתחבר...',
      loginError: 'שגיאה בהתחברות',
      invalidCredentials: 'פרטי התחברות שגויים',
      networkError: 'בעיית רשת - נסו שוב',
      sessionExpired: 'הפגישה פגה תוקף',
      checkEmail: 'בדקו את האימייל לקישור אימות',
      orContinueWith: 'או המשיכו עם',
      hasAccount: 'יש לכם חשבון? התחברו',
      forgotPassword: 'שכחתם סיסמה?'
    },

    // Dashboard
    dashboard: {
      welcome: 'ברוכים הבאים',
      welcomeMessage: 'ברוכים הבאים למערכת ניהול ציד האוצרות',
      quickStats: 'סטטיסטיקות מהירות',
      totalEvents: 'סה״כ אירועים',
      activeEvents: 'אירועים פעילים',
      totalParticipants: 'סה״כ משתתפים',
      completedHunts: 'ציידים שהושלמו',
      recentActivity: 'פעילות אחרונה',
      quickActions: 'פעולות מהירות',
      createEvent: 'צור אירוע חדש',
      manageModels: 'נהל מודלי ציד',
      viewReports: 'צפה בדוחות',
      manageBilling: 'נהל תשלומים'
    },

    // Events
    events: {
      title: 'אירועים',
      description: 'נהלו את כל אירועי ציד האוצרות שלכם',
      createNew: 'צור אירוע חדש',
      noEvents: 'אין אירועים עדיין',
      noEventsDescription: 'צרו את האירוע הראשון שלכם כדי להתחיל',
      eventName: 'שם האירוע',
      childName: 'שם הילד/ה',
      eventDate: 'תאריך האירוע',
      participantCount: 'מספר משתתפים',
      huntModel: 'מודל ציד',
      location: 'מיקום',
      specialNotes: 'הערות מיוחדות',
      duration: 'משך זמן (דקות)',
      status: 'סטטוס',
      created: 'נוצר',
      updated: 'עודכן',
      viewDetails: 'צפה בפרטים',
      editEvent: 'ערוך אירוע',
      deleteEvent: 'מחק אירוע',
      duplicateEvent: 'שכפל אירוע',
      exportEvent: 'ייצא אירוע',
      startEvent: 'התחל אירוע',
      endEvent: 'סיים אירוע',
      pauseEvent: 'השהה אירוע',
      setupStations: 'הגדר עמדות',
      manageTeams: 'נהל צוותים',
      viewAnalytics: 'צפה באנליטיקס'
    },

    // Hunt Models
    models: {
      title: 'מודלי ציד',
      description: 'תבניות לציד אוצרות שניתן לעשות בהן שימוש חוזר',
      createNew: 'צור מודל חדש',
      noModels: 'אין מודלים עדיין',
      noModelsDescription: 'צרו מודל ציד ראשון כדי להתחיל לתכנן אירועים',
      modelName: 'שם המודל',
      modelDescription: 'תיאור המודל',
      estimatedDuration: 'משך זמן משוער (דקות)',
      difficulty: 'רמת קושי',
      minAge: 'גיל מינימלי',
      maxAge: 'גיל מקסימלי',
      maxParticipants: 'מספר משתתפים מקסימלי',
      category: 'קטגוריה',
      tags: 'תגיות',
      isPublic: 'מודל ציבורי',
      stationsCount: 'מספר עמדות',
      missionsCount: 'מספר משימות',
      viewStations: 'צפה בעמדות',
      editStations: 'ערוך עמדות',
      addStation: 'הוסף עמדה',
      viewMissions: 'צפה במשימות',
      editMissions: 'ערוך משימות',
      addMission: 'הוסף משימה',
      difficulty: {
        easy: 'קל',
        medium: 'בינוני',
        hard: 'קשה',
        expert: 'מומחה'
      },
      categories: {
        birthday: 'יום הולדת',
        corporate: 'אירוע חברה',
        school: 'בית ספר',
        family: 'משפחתי',
        team_building: 'בניית צוות',
        educational: 'חינוכי',
        seasonal: 'עונתי',
        custom: 'מותאם אישית'
      }
    },

    // Stations
    stations: {
      title: 'עמדות',
      description: 'נקודות עצירה בציד האוצרות',
      createNew: 'צור עמדה חדשה',
      stationId: 'מזהה עמדה',
      displayName: 'שם תצוגה',
      stationType: 'סוג עמדה',
      activityDescription: 'תיאור הפעילות',
      locationHint: 'רמז למיקום',
      propsNeeded: 'אביזרים נדרשים',
      estimatedDuration: 'זמן משוער (דקות)',
      difficultyLevel: 'רמת קושי',
      points: 'נקודות',
      isActive: 'עמדה פעילה',
      types: {
        puzzle: 'חידה',
        physical: 'משימה גופנית',
        creative: 'יצירתי',
        knowledge: 'ידע כלל',
        social: 'חברתי',
        observation: 'תצפית',
        memory: 'זיכרון',
        skill: 'מיומנות'
      }
    },

    // Missions
    missions: {
      title: 'משימות',
      description: 'משימות וחידות לכל עמדה',
      createNew: 'צור משימה חדשה',
      missionTitle: 'כותרת המשימה',
      clueText: 'טקסט הרמז',
      solution: 'פתרון',
      hints: 'רמזים נוספים',
      timeLimit: 'מגבלת זמן (דקות)',
      videoTemplate: 'תבנית וידאו',
      overlaySpec: 'מפרט כיסוי',
      locale: 'שפה',
      isActive: 'משימה פעילה',
      toStation: 'לעמדה',
      successMessage: 'הודעת הצלחה',
      failureMessage: 'הודעת כישלון',
      validationRules: 'כללי אימות'
    },

    // Video Templates
    templates: {
      title: 'תבניות וידאו',
      description: 'תבניות לויידאו מותאמות אישית לאירועים',
      createNew: 'צור תבנית חדשה',
      templateName: 'שם התבנית',
      templateDescription: 'תיאור התבנית',
      duration: 'משך זמן (שניות)',
      resolution: 'רזולוציה',
      fps: 'פריימים לשנייה',
      timeline: 'ציר זמן',
      elements: 'אלמנטים',
      layers: 'שכבות',
      transitions: 'מעברים',
      effects: 'אפקטים',
      audio: 'אודיו',
      export: 'ייצוא',
      preview: 'תצוגה מקדימה',
      render: 'עיבוד'
    },

    // Teams & Players
    teams: {
      title: 'צוותים',
      description: 'ניהול צוותים ומשתתפים',
      createNew: 'צור צוות חדש',
      teamName: 'שם הצוות',
      teamCode: 'קוד צוות',
      participants: 'משתתפים',
      currentStation: 'עמדה נוכחית',
      score: 'ניקוד',
      progress: 'התקדמות',
      startTime: 'זמן התחלה',
      endTime: 'זמן סיום',
      totalTime: 'זמן כולל',
      rank: 'דירוג',
      status: 'סטטוס',
      addParticipant: 'הוסף משתתף',
      removeParticipant: 'הסר משתתף',
      viewProgress: 'צפה בהתקדמות',
      resetProgress: 'אפס התקדמות'
    },

    // Billing
    billing: {
      title: 'תשלומים ומנויים',
      description: 'ניהול התכנית והתשלומים',
      currentPlan: 'התכנית הנוכחית',
      usage: 'שימוש',
      paymentHistory: 'היסטוריית תשלומים',
      invoices: 'חשבוניות',
      upgradeplan: 'שדרג תכנית',
      managePlan: 'נהל מנוי',
      billingInfo: 'פרטי חיוב',
      paymentMethods: 'אמצעי תשלום',
      nextBilling: 'חיוב הבא',
      amount: 'סכום',
      currency: 'מטבע',
      renewsOn: 'מתחדש ב',
      cancelSubscription: 'בטל מנוי',
      downloadInvoice: 'הורד חשבונית',
      plans: {
        free: 'תכנית בחינם',
        basic: 'תכנית בסיסית',
        pro: 'תכנית מקצועית',
        enterprise: 'תכנית ארגונית'
      },
      features: {
        eventsPerMonth: 'אירועים בחודש',
        participantsPerEvent: 'משתתפים לאירוע',
        videoStorage: 'אחסון וידאו',
        support: 'תמיכה',
        customTemplates: 'תבניות מותאמות',
        customBranding: 'ברנדינג מותאם',
        analytics: 'אנליטיקס',
        sso: 'כניסה מאוחדת'
      }
    },

    // Player App
    player: {
      welcome: 'ברוכים הבאים לציד האוצרות',
      enterTeamCode: 'הזינו קוד צוות',
      teamCodePlaceholder: 'קוד הצוות שקיבלתם',
      joinTeam: 'התחבר לצוות',
      scanQR: 'סרוק QR Code',
      currentMission: 'המשימה הנוכחית',
      nextStation: 'העמדה הבאה',
      completedStations: 'עמדות שהושלמו',
      totalStations: 'סה״כ עמדות',
      yourScore: 'הניקוד שלכם',
      timeElapsed: 'זמן שעבר',
      recordVideo: 'הקלט וידאו',
      startRecording: 'התחל הקלטה',
      stopRecording: 'עצור הקלטה',
      uploadVideo: 'העלה וידאו',
      completeMission: 'סיים משימה',
      congratulations: 'מזל טוב!',
      huntCompleted: 'השלמתם את הציד בהצלחה!',
      finalScore: 'הניקוד הסופי',
      yourRank: 'הדירוג שלכם',
      shareResults: 'שתפו את התוצאות',
      playAgain: 'שחקו שוב'
    },

    // QR Scanner
    qr: {
      title: 'סריקת QR Code',
      description: 'סרקו את הקוד בעמדה או הזינו ידנית',
      startCamera: 'פתח מצלמה',
      scanning: 'סורק...',
      processing: 'מעבד...',
      manualEntry: 'הזנה ידנית',
      stationCode: 'קוד עמדה',
      stationCodePlaceholder: 'למשל: ST001',
      goToStation: 'עבור לעמדה',
      cameraPermissionDenied: 'גישה למצלמה נדחתה',
      cameraNotSupported: 'מצלמה לא נתמכת',
      invalidQR: 'קוד QR לא תקין',
      stationNotFound: 'עמדה לא נמצאה',
      instructions: 'הוראות שימוש',
      troubleshooting: 'פתרון בעיות'
    },

    // Exports
    exports: {
      title: 'ייצוא אירוע',
      description: 'ייצוא קודי QR ומסמכי האירוע',
      exportOptions: 'אפשרויות ייצוא',
      stationQRs: 'קודי QR לעמדות',
      eventSummary: 'סיכום האירוע',
      teamList: 'רשימת צוותים',
      setupGuide: 'מדריך הכנת האירוע',
      generatePDF: 'יצור והורד PDF',
      generating: 'יוצר קובץ...',
      downloadReady: 'הקובץ מוכן להורדה',
      downloadError: 'שגיאה ביצירת הקובץ'
    },

    // Errors
    errors: {
      generic: 'אירעה שגיאה לא צפויה',
      network: 'בעיית רשת - בדקו את החיבור לאינטרנט',
      unauthorized: 'אין הרשאה לבצע פעולה זו',
      forbidden: 'גישה נדחתה',
      notFound: 'הפריט המבוקש לא נמצא',
      validation: 'נתונים לא תקינים',
      timeout: 'הפעולה ארכה יותר מדי זמן',
      server: 'שגיאת שרת - נסו שוב מאוחר יותר'
    },

    // Success Messages
    success: {
      saved: 'נשמר בהצלחה',
      created: 'נוצר בהצלחה',
      updated: 'עודכן בהצלחה',
      deleted: 'נמחק בהצלחה',
      uploaded: 'הועלה בהצלחה',
      sent: 'נשלח בהצלחה',
      copied: 'הועתק בהצלחה'
    }
  },

  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      home: 'Home',
      dashboard: 'Dashboard',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      phone: 'Phone',
      address: 'Address',
      date: 'Date',
      time: 'Time',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      draft: 'Draft',
      ready: 'Ready'
    },

    // Navigation
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      events: 'Events',
      models: 'Hunt Models',
      templates: 'Video Templates',
      stations: 'Stations',
      missions: 'Missions',
      billing: 'Billing',
      admin: 'Admin',
      play: 'Play',
      help: 'Help',
      contact: 'Contact'
    },

    // Authentication
    auth: {
      welcomeBack: 'Welcome Back',
      loginDescription: 'Sign in to your scavenger hunt management system',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      loginButton: 'Sign In',
      loginWithGoogle: 'Sign in with Google',
      forgotPassword: 'Forgot Password?',
      noAccount: 'Don\'t have an account?',
      createAccount: 'Create Account',
      loggingIn: 'Signing in...',
      loginError: 'Login Error',
      invalidCredentials: 'Invalid credentials',
      networkError: 'Network error - please try again',
      sessionExpired: 'Session expired'
    },

    // Dashboard
    dashboard: {
      welcome: 'Welcome',
      welcomeMessage: 'Welcome to the Scavenger Hunt Management System',
      quickStats: 'Quick Stats',
      totalEvents: 'Total Events',
      activeEvents: 'Active Events',
      totalParticipants: 'Total Participants',
      completedHunts: 'Completed Hunts',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      createEvent: 'Create New Event',
      manageModels: 'Manage Hunt Models',
      viewReports: 'View Reports',
      manageBilling: 'Manage Billing'
    },

    // Events
    events: {
      title: 'Events',
      description: 'Manage all your scavenger hunt events',
      createNew: 'Create New Event',
      noEvents: 'No events yet',
      noEventsDescription: 'Create your first event to get started',
      eventName: 'Event Name',
      childName: 'Child Name',
      eventDate: 'Event Date',
      participantCount: 'Participant Count',
      huntModel: 'Hunt Model',
      location: 'Location',
      specialNotes: 'Special Notes',
      duration: 'Duration (minutes)',
      status: 'Status',
      created: 'Created',
      updated: 'Updated',
      viewDetails: 'View Details',
      editEvent: 'Edit Event',
      deleteEvent: 'Delete Event',
      duplicateEvent: 'Duplicate Event',
      exportEvent: 'Export Event',
      startEvent: 'Start Event',
      endEvent: 'End Event',
      pauseEvent: 'Pause Event',
      setupStations: 'Setup Stations',
      manageTeams: 'Manage Teams',
      viewAnalytics: 'View Analytics'
    }

    // ... additional English translations would continue here
  }
}

export function t(key: string, locale: string = 'he'): string {
  const keys = key.split('.')
  let current: any = translations[locale] || translations.he
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      // Fallback to Hebrew if English translation missing
      current = translations.he
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = current[fallbackKey]
        } else {
          return key // Return key if no translation found
        }
      }
      break
    }
  }
  
  return typeof current === 'string' ? current : key
}