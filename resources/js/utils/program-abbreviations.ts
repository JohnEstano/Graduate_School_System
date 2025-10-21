export const PROGRAM_ABBREVIATIONS: Record<string, string> = {
  'Master of Arts in Education major in English': 'MAEd-English',
  'Master of Arts in Education major in Sociology': 'MAEd-Sociology',
  'Master of Arts in Education major in Mathematics': 'MAEd-Math',
  'Master of Arts in Education major in Physical Education': 'MAEd-PE',
  'Master of Arts in Educational Management': 'MAEd-Mgmt',
  'Master of Arts in Elementary Education': 'MAEd-Elementary',
  'Master of Arts in Teaching College Chemistry': 'MAT-Chem',
  'Master of Arts in Teaching College Physics': 'MAT-Physics',
  'Master of Arts in Engineering Education with majors in Civil Engineering': 'MAEngEd-Civil',
  'Master of Arts in Engineering Education with majors in Electronics Communications Engineering': 'MAEngEd-ECE',
  'Master of Arts in Values Education': 'MA-ValuesEd',
  'Master in Business Administration': 'MBA',
  'Master of Information Technology': 'MIT',
  'Master in Information Systems': 'MIS',
  'Master of Science in Pharmacy': 'MSPharm',
  'Master of Science in Medical Technology/ Medical Laboratory Science': 'MSMT/MLS',
  'Master of Arts in Education major in Filipino': 'MAEd-Filipino',
  'Master of Arts in Education major in Music Education': 'MAEd-Music',
  'Master of Arts in Education major in Information Technology Integration': 'MAEd-IT',
  'Doctor in Business Management': 'DBM',
  'Doctor of Philosophy in Education major in Applied Linguistics': 'PhD-Ed-Linguistics',
  'Doctor of Philosophy in Education major in Educational Leadership': 'PhD-Ed-Leadership',
  'Doctor of Philosophy in Education major in Filipino': 'PhD-Ed-Filipino',
  'Doctor of Philosophy in Education major in Mathematics': 'PhD-Ed-Math',
  'Doctor of Philosophy in Education major in Counseling': 'PhD-Ed-Counseling',
  'Doctor of Philosophy in Education major in  Information Technology Integration': 'PhD-Ed-IT',
  'Doctor of Philosophy in Education major in Physical Education': 'PhD-Ed-PE',
  'DOCTOR OF PHILOSOPHY IN PHARMACY': 'PhD-Pharmacy',
  'Master in Counseling': 'MC',
};

export function getProgramAbbreviation(program: string): string {
  return PROGRAM_ABBREVIATIONS[program] || program;
}

export function classifyProgramLevel(program?: string | null): "Masteral" | "Doctorate" {
  if (!program) return "Masteral";
  const p = program.toLowerCase().trim();
  const doc = ["phd", "ph.d", "doctor", "doctoral", "doctorate", "edd", "ed.d", "dm", "d.m", "dba", "d.b.a"];
  if (doc.some(k => p.includes(k))) return "Doctorate";
  if (/^(d[.\-\s]|doctor)/.test(p)) return "Doctorate";
  return "Masteral";
}