// Import gender-specific headshots - Male (diverse backgrounds & styles)
import headshotM01 from "@/assets/headshots/headshot-m-01.jpg";
import headshotM02 from "@/assets/headshots/headshot-m-02.jpg";
import headshotM03 from "@/assets/headshots/headshot-m-03.jpg";
import headshotM04 from "@/assets/headshots/headshot-m-04.jpg";
import headshotM05 from "@/assets/headshots/headshot-m-05.jpg";
import headshotM06 from "@/assets/headshots/headshot-m-06.jpg";
import headshotM07 from "@/assets/headshots/headshot-m-07.jpg";
import headshotM08 from "@/assets/headshots/headshot-m-08.jpg";
import headshotM09 from "@/assets/headshots/headshot-m-09.jpg";
import headshotM10 from "@/assets/headshots/headshot-m-10.jpg";
import headshotM11 from "@/assets/headshots/headshot-m-11.jpg";
import headshotM12 from "@/assets/headshots/headshot-m-12.jpg";
import headshotM13 from "@/assets/headshots/headshot-m-13.jpg";
import headshotM14 from "@/assets/headshots/headshot-m-14.jpg";
import headshotM15 from "@/assets/headshots/headshot-m-15.jpg";

// Import gender-specific headshots - Female (diverse backgrounds & styles)
import headshotF01 from "@/assets/headshots/headshot-f-01.jpg";
import headshotF02 from "@/assets/headshots/headshot-f-02.jpg";
import headshotF03 from "@/assets/headshots/headshot-f-03.jpg";
import headshotF04 from "@/assets/headshots/headshot-f-04.jpg";
import headshotF05 from "@/assets/headshots/headshot-f-05.jpg";
import headshotF06 from "@/assets/headshots/headshot-f-06.jpg";
import headshotF07 from "@/assets/headshots/headshot-f-07.jpg";
import headshotF08 from "@/assets/headshots/headshot-f-08.jpg";
import headshotF09 from "@/assets/headshots/headshot-f-09.jpg";
import headshotF10 from "@/assets/headshots/headshot-f-10.jpg";
import headshotF11 from "@/assets/headshots/headshot-f-11.jpg";
import headshotF12 from "@/assets/headshots/headshot-f-12.jpg";
import headshotF13 from "@/assets/headshots/headshot-f-13.jpg";
import headshotF14 from "@/assets/headshots/headshot-f-14.jpg";
import headshotF15 from "@/assets/headshots/headshot-f-15.jpg";

// Separate arrays for male and female headshots (15 each = 30 total)
export const maleHeadshots = [
  headshotM01,
  headshotM02,
  headshotM03,
  headshotM04,
  headshotM05,
  headshotM06,
  headshotM07,
  headshotM08,
  headshotM09,
  headshotM10,
  headshotM11,
  headshotM12,
  headshotM13,
  headshotM14,
  headshotM15,
];

export const femaleHeadshots = [
  headshotF01,
  headshotF02,
  headshotF03,
  headshotF04,
  headshotF05,
  headshotF06,
  headshotF07,
  headshotF08,
  headshotF09,
  headshotF10,
  headshotF11,
  headshotF12,
  headshotF13,
  headshotF14,
  headshotF15,
];

// Headshot key options for admin selection (maps key to import)
export const headshotKeyMap: Record<string, string> = {
  'm-01': headshotM01, 'm-02': headshotM02, 'm-03': headshotM03, 'm-04': headshotM04, 'm-05': headshotM05,
  'm-06': headshotM06, 'm-07': headshotM07, 'm-08': headshotM08, 'm-09': headshotM09, 'm-10': headshotM10,
  'm-11': headshotM11, 'm-12': headshotM12, 'm-13': headshotM13, 'm-14': headshotM14, 'm-15': headshotM15,
  'f-01': headshotF01, 'f-02': headshotF02, 'f-03': headshotF03, 'f-04': headshotF04, 'f-05': headshotF05,
  'f-06': headshotF06, 'f-07': headshotF07, 'f-08': headshotF08, 'f-09': headshotF09, 'f-10': headshotF10,
  'f-11': headshotF11, 'f-12': headshotF12, 'f-13': headshotF13, 'f-14': headshotF14, 'f-15': headshotF15,
};

// Options for admin headshot selector dropdown
export const headshotOptions = [
  { value: 'auto', label: 'Auto-assign (based on name)' },
  { value: 'm-01', label: 'Male 01' }, { value: 'm-02', label: 'Male 02' }, { value: 'm-03', label: 'Male 03' },
  { value: 'm-04', label: 'Male 04' }, { value: 'm-05', label: 'Male 05' }, { value: 'm-06', label: 'Male 06' },
  { value: 'm-07', label: 'Male 07' }, { value: 'm-08', label: 'Male 08' }, { value: 'm-09', label: 'Male 09' },
  { value: 'm-10', label: 'Male 10' }, { value: 'm-11', label: 'Male 11' }, { value: 'm-12', label: 'Male 12' },
  { value: 'm-13', label: 'Male 13' }, { value: 'm-14', label: 'Male 14' }, { value: 'm-15', label: 'Male 15' },
  { value: 'f-01', label: 'Female 01' }, { value: 'f-02', label: 'Female 02' }, { value: 'f-03', label: 'Female 03' },
  { value: 'f-04', label: 'Female 04' }, { value: 'f-05', label: 'Female 05' }, { value: 'f-06', label: 'Female 06' },
  { value: 'f-07', label: 'Female 07' }, { value: 'f-08', label: 'Female 08' }, { value: 'f-09', label: 'Female 09' },
  { value: 'f-10', label: 'Female 10' }, { value: 'f-11', label: 'Female 11' }, { value: 'f-12', label: 'Female 12' },
  { value: 'f-13', label: 'Female 13' }, { value: 'f-14', label: 'Female 14' }, { value: 'f-15', label: 'Female 15' },
];

// Common female first names for gender detection
const femaleNames = new Set([
  'abigail', 'alexandra', 'alice', 'alicia', 'allison', 'amanda', 'amber', 'amy', 'andrea', 'angela',
  'anna', 'anne', 'annie', 'ashley', 'barbara', 'beatrice', 'beth', 'betty', 'beverly', 'brenda',
  'bridget', 'brittany', 'brooke', 'camille', 'carla', 'carmen', 'carol', 'caroline', 'carrie', 'cassandra',
  'catherine', 'cathy', 'charlotte', 'chelsea', 'cheryl', 'christina', 'christine', 'cindy', 'claire', 'clara',
  'claudia', 'colleen', 'courtney', 'crystal', 'cynthia', 'daisy', 'dana', 'danielle', 'daphne', 'dawn',
  'debbie', 'deborah', 'denise', 'diana', 'diane', 'dolores', 'donna', 'doris', 'dorothy', 'edith',
  'eileen', 'elaine', 'elena', 'elizabeth', 'ella', 'ellen', 'emily', 'emma', 'erica', 'erin',
  'esther', 'eva', 'evelyn', 'faith', 'fiona', 'florence', 'frances', 'gabriella', 'gail', 'gloria',
  'grace', 'gwen', 'haley', 'hannah', 'harriet', 'heather', 'heidi', 'helen', 'hillary', 'holly',
  'irene', 'iris', 'isabel', 'isabella', 'jackie', 'jacqueline', 'jade', 'jane', 'janet',
  'janice', 'jasmine', 'jean', 'jeanette', 'jennifer', 'jenny', 'jessica', 'jill', 'joan', 'joanna',
  'jocelyn', 'jodie', 'josephine', 'joyce', 'judith', 'judy', 'julia', 'juliana', 'julie', 'june',
  'karen', 'kate', 'katherine', 'kathleen', 'kathryn', 'kathy', 'katie', 'kayla', 'kelly', 'kendra',
  'kim', 'kimberly', 'kristen', 'kristin', 'laura', 'lauren', 'leah', 'leslie', 'lillian', 'lily',
  'linda', 'lisa', 'liz', 'lois', 'lorraine', 'louise', 'lucy', 'lynn', 'madeleine', 'madison',
  'maggie', 'margaret', 'maria', 'marian', 'marie', 'marilyn', 'marjorie', 'marlene', 'martha', 'mary',
  'megan', 'melanie', 'melissa', 'meredith', 'mia', 'michelle', 'mildred', 'miranda', 'molly', 'monica',
  'nancy', 'natalie', 'natasha', 'nicole', 'nina', 'nora', 'norma', 'olivia', 'paige', 'pamela',
  'patricia', 'paula', 'pauline', 'peggy', 'penny', 'phyllis', 'priscilla', 'rachel', 'rebecca', 'renee',
  'rhonda', 'rita', 'roberta', 'rosa', 'rose', 'rosemary', 'ruby', 'ruth', 'sabrina',
  'sally', 'samantha', 'sandra', 'sara', 'sarah', 'shannon', 'sharon', 'sheila', 'shelly', 'shirley',
  'sierra', 'sophia', 'stacy', 'stella', 'stephanie', 'sue', 'susan', 'suzanne', 'sylvia', 'tamara',
  'tammy', 'tanya', 'tara', 'teresa', 'thelma', 'theresa', 'tiffany', 'tina', 'tracy', 'valerie',
  'vanessa', 'vera', 'veronica', 'vicky', 'victoria', 'violet', 'virginia', 'vivian', 'wanda', 'wendy',
  'whitney', 'yvonne', 'zoe',
]);

// Common male first names for gender detection
const maleNames = new Set([
  'aaron', 'adam', 'adrian', 'ahmed', 'alan', 'albert', 'alec', 'alex', 'alexander', 'alfred', 'allen',
  'andrew', 'andy', 'anthony', 'antonio', 'arthur', 'austin', 'barry', 'ben', 'benjamin', 'bernard',
  'bill', 'billy', 'bob', 'bobby', 'brad', 'bradley', 'brandon', 'brent', 'brett', 'brian',
  'bruce', 'bryan', 'byron', 'caleb', 'calvin', 'cameron', 'carl', 'carlos', 'chad', 'charles',
  'charlie', 'chase', 'chris', 'christian', 'christopher', 'clarence', 'clark', 'claude', 'clay', 'clifford',
  'clint', 'clyde', 'cody', 'colin', 'connor', 'corey', 'craig', 'curtis', 'dale', 'dan',
  'daniel', 'danny', 'darren', 'dave', 'david', 'dean', 'dennis', 'derek', 'derrick', 'desmond',
  'devin', 'diego', 'donald', 'douglas', 'drew', 'duke', 'dustin', 'dylan', 'earl', 'ed',
  'eddie', 'edgar', 'edmund', 'edward', 'edwin', 'eli', 'elijah', 'elliot', 'eric', 'ernest',
  'ethan', 'eugene', 'evan', 'felix', 'floyd', 'francis', 'frank', 'fred', 'frederick', 'gabriel',
  'gary', 'gavin', 'gene', 'george', 'gerald', 'gilbert', 'glen', 'glenn', 'gordon', 'graham',
  'grant', 'greg', 'gregory', 'guy', 'harold', 'harrison', 'harry', 'harvey', 'heath', 'hector',
  'henry', 'herbert', 'herman', 'howard', 'hugh', 'hunter', 'ian', 'isaac', 'ivan', 'jack',
  'jackson', 'jacob', 'jake', 'james', 'jared', 'jason', 'jay', 'jeff', 'jeffrey',
  'jeremy', 'jerome', 'jerry', 'jesse', 'jim', 'jimmy', 'joe', 'joel', 'john', 'johnny',
  'jon', 'jonathan', 'jordan', 'jorge', 'jose', 'joseph', 'josh', 'joshua', 'juan', 'julian', 'pat', 'patrick',
  'justin', 'karl', 'keith', 'ken', 'kenneth', 'kent', 'kevin', 'kirk', 'kurt', 'kyle',
  'lance', 'larry', 'lawrence', 'lee', 'leo', 'leon', 'leonard', 'leroy', 'lewis', 'liam',
  'lloyd', 'logan', 'louis', 'lucas', 'luis', 'luke', 'marcus', 'mark', 'marshall', 'martin',
  'marvin', 'mason', 'matt', 'matthew', 'maurice', 'max', 'maxwell', 'michael', 'miguel', 'mike',
  'miles', 'mitchell', 'morris', 'nathan', 'nathaniel', 'neil', 'nelson', 'nicholas', 'nick', 'noah',
  'noel', 'norman', 'oliver', 'omar', 'oscar', 'owen', 'paul', 'pedro', 'perry',
  'peter', 'philip', 'phillip', 'pierce', 'ralph', 'randall', 'randy', 'ray', 'raymond', 'reginald',
  'rex', 'richard', 'rick', 'ricky', 'rob', 'robert', 'rodney', 'roger', 'roland',
  'ron', 'ronald', 'ross', 'roy', 'ruben', 'russell', 'ryan', 'sam', 'samuel', 'scott',
  'sean', 'sebastian', 'sergio', 'seth', 'shane', 'shawn', 'sidney', 'simon', 'spencer', 'stanley',
  'stephen', 'steve', 'steven', 'stuart', 'ted', 'terry', 'theodore', 'thomas', 'tim', 'timothy',
  'todd', 'tom', 'tommy', 'tony', 'travis', 'trevor', 'troy', 'tyler', 'vernon', 'victor',
  'vincent', 'wade', 'walter', 'warren', 'wayne', 'wesley', 'will', 'william', 'willie', 'winston',
  'wyatt', 'xavier', 'zachary', 'zane',
]);

// Detect gender from name
export function detectGender(fullName: string): 'male' | 'female' {
  const parts = fullName.toLowerCase().trim().split(/\s+/);
  if (parts.length === 0) return 'male'; // Default fallback
  
  let firstName = parts[0];
  
  // Handle titles like "Dr.", "Mr.", "Mrs.", "Ms.", "Prof."
  const maleTitles = ['mr.', 'mr'];
  const femaleTitles = ['mrs.', 'mrs', 'ms.', 'ms', 'miss', 'miss.'];
  const neutralTitles = ['dr.', 'dr', 'prof.', 'prof', 'professor'];
  
  if (maleTitles.includes(firstName)) return 'male';
  if (femaleTitles.includes(firstName)) return 'female';
  
  // If neutral title, check the next name
  if (neutralTitles.includes(firstName) && parts.length > 1) {
    firstName = parts[1];
  }
  
  // Check against name databases
  if (femaleNames.has(firstName)) return 'female';
  if (maleNames.has(firstName)) return 'male';
  
  // Default to male if unknown
  return 'male';
}

// Deterministic assignment storage - computed once when testimonials load
const maleAssignments = new Map<string, number>();
const femaleAssignments = new Map<string, number>();
let isInitialized = false;

// Initialize headshot assignments deterministically based on sorted IDs
// This ensures the same testimonial always gets the same headshot regardless of render order
export function initializeHeadshotAssignments(
  testimonials: Array<{ id: string; clientName: string }>
): void {
  // Clear previous assignments
  maleAssignments.clear();
  femaleAssignments.clear();
  
  // Separate testimonials by gender
  const males: Array<{ id: string; clientName: string }> = [];
  const females: Array<{ id: string; clientName: string }> = [];
  
  testimonials.forEach((t) => {
    const gender = detectGender(t.clientName);
    if (gender === 'female') {
      females.push(t);
    } else {
      males.push(t);
    }
  });
  
  // Sort alphabetically by ID for deterministic ordering
  males.sort((a, b) => a.id.localeCompare(b.id));
  females.sort((a, b) => a.id.localeCompare(b.id));
  
  // Assign headshots sequentially based on sorted position
  males.forEach((t, index) => {
    maleAssignments.set(t.id, index % maleHeadshots.length);
  });
  
  females.forEach((t, index) => {
    femaleAssignments.set(t.id, index % femaleHeadshots.length);
  });
  
  isInitialized = true;
}

// Get unique headshot for a testimonial
// Priority: 1) Manual headshot_key, 2) Pre-computed assignment, 3) Hash-based fallback
export function getUniqueHeadshot(
  id: string, 
  clientName: string = '', 
  headshotKey?: string | null
): string {
  // 1. If manual headshot_key is set, use it
  if (headshotKey && headshotKeyMap[headshotKey]) {
    return headshotKeyMap[headshotKey];
  }
  
  const gender = detectGender(clientName);
  const pool = gender === 'female' ? femaleHeadshots : maleHeadshots;
  const assignments = gender === 'female' ? femaleAssignments : maleAssignments;
  
  // 2. Use pre-computed assignment if available
  if (isInitialized && assignments.has(id)) {
    const index = assignments.get(id)!;
    return pool[index];
  }
  
  // 3. Fallback: use stable hash for ID not in initialization set
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

// Reset function for testing or component unmounts
export function resetHeadshotAssignments(): void {
  maleAssignments.clear();
  femaleAssignments.clear();
  isInitialized = false;
}

// Format name as "FirstName L."
export function formatPrivacyName(fullName: string): string {
  if (!fullName) return "";
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  
  // Handle titles like "Dr."
  let firstName = parts[0];
  let lastInitial = "";
  
  if (parts.length === 1) {
    return firstName;
  }
  
  // If first part is a title (Dr., Mr., Mrs., etc.), include it with first name
  const titles = ["dr.", "mr.", "mrs.", "ms.", "prof."];
  if (titles.includes(firstName.toLowerCase())) {
    if (parts.length >= 2) {
      firstName = `${parts[0]} ${parts[1]}`;
      if (parts.length >= 3) {
        lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
      }
    }
  } else {
    // Standard case: FirstName + last initial
    lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  }
  
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}
