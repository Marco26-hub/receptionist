export const demoOrganization = { id: "demo-org", name: "Maison Élan Milano", city: "Milano", toneOfVoice: "Caldo, elegante e discreto" };

export const demoOpportunities = [
  { id: "opp-1", customerId: "cus-1", customerName: "Martina R.", phone: "+39 333 000 0001", type: "inactive_client", title: "Riprendi il percorso laser", reason: "Ultima visita 94 giorni fa · 4 sedute completate", score: 92, estimatedValueCents: 42000, status: "new", message: "Ciao Martina, come stai? È passato un po’ di tempo dall’ultima seduta. Se vuoi riprendere il percorso, questa settimana abbiamo una disponibilità adatta a te. Vuoi che ti mandi gli orari?" },
  { id: "opp-2", customerId: "cus-2", customerName: "Giulia B.", phone: "+39 333 000 0002", type: "empty_slot", title: "Riempi venerdì alle 15:30", reason: "Compatibile con trattamento viso · disponibilità recente", score: 84, estimatedValueCents: 18000, status: "drafted", message: "Ciao Giulia, si è liberato un posto venerdì alle 15:30, della durata giusta per il tuo prossimo trattamento viso. Può esserti comodo?" },
  { id: "opp-3", customerId: "cus-3", customerName: "Elena P.", phone: "+39 333 000 0003", type: "follow_up", title: "Controllo dopo il trattamento", reason: "Follow-up previsto oggi", score: 76, estimatedValueCents: 9000, status: "drafted", message: "Ciao Elena, come ti sei trovata dopo il trattamento di venerdì? Quando hai un momento, raccontaci come sta andando." },
];

export const demoMetrics = { potentialValueCents: 229000, activeOpportunities: 33, emptySlots: 4, messagesToApprove: 12, conversionRate: 18 };

