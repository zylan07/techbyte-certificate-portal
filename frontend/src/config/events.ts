import { EventConfig } from '../types';

export const EVENTS: EventConfig[] = [
  {
    id: 'paper-presentation',
    name: 'Paper Presentation',
    template: 'standard',
    template_filename: 'Paper Presentation Participation.png',
    date: '14 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Technical paper presentation evaluating research innovation and methodology.',
    category: 'participation'
  },
  {
    id: 'project-presentation',
    name: 'Project Presentation',
    template: 'standard',
    template_filename: 'Project Presentation Participation.png',
    date: '14 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Working prototype and engineering project demonstration.',
    category: 'participation'
  },
  {
    id: 'poster-presentation',
    name: 'Poster Presentation',
    template: 'standard',
    template_filename: 'Poster Presentation Participation.png',
    date: '14 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Visual technical poster display and conceptual interaction.',
    category: 'participation'
  },
  {
    id: 'executive-development-programme',
    name: 'Executive Development Programme',
    template: 'standard',
    template_filename: 'Executive Development Programme Participation.png',
    date: '15 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Professional leadership and executive skill acceleration programme.',
    category: 'participation'
  },
  {
    id: 'conclave-on-emergent-trends',
    name: 'Conclave on Emergent Trends',
    template: 'standard',
    template_filename: 'Conclave on Emergent Trends Participation.png',
    date: '15 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Industry panel dialogue on emergent technological horizons.',
    category: 'participation'
  },
  {
    id: 'coding-contest',
    name: 'Coding Contest',
    template: 'geeksforgeeks',
    template_filename: 'Coding Contest Participation.png',
    date: '15 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Algorithmic speed problem-solving contest powered by GeeksforGeeks.',
    category: 'participation'
  },
  {
    id: '12-hour-hackathon',
    name: '12-Hour Hackathon',
    template: 'geeksforgeeks',
    template_filename: 'Hackathon Participation.png',
    date: '14 & 15 October 2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology',
    description: 'Overnight product development hackathon in partnership with GeeksforGeeks.',
    category: 'participation'
  },
  {
    id: 'certificate-of-recognition',
    name: 'Certificate of Recognition',
    template: 'recognition',
    template_filename: 'Certificate_of_recognition.png',
    date: '14.10.2026 & 15.10.2026',
    department: 'Department of Computer Science and Engineering',
    institution: 'KPR Institute of Engineering and Technology, Coimbatore',
    description: 'In recognition of passion, dedication, and relentless efforts in making TechByte Summit ’26 a remarkable success.',
    category: 'recognition'
  }
];

export function getEventByName(name: string): EventConfig | undefined {
  return EVENTS.find(e => e.name.toLowerCase() === name.toLowerCase());
}
