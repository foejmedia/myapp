/**
 * Word of the Day: common words of the Qur'an.
 * Example ayat are quoted with their reference; meanings follow Saheeh International.
 * Please have these checked by a teacher before publishing widely.
 */
export type QuranWord = {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  example?: { arabic: string; meaning: string; ref: string };
};

export const WORDS: QuranWord[] = [
  { id: 'rabb', arabic: 'رَبّ', transliteration: 'Rabb', meaning: 'Lord, Sustainer',
    example: { arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', meaning: 'All praise is for Allah, Lord of the worlds.', ref: 'Al-Fatihah 1:2' } },
  { id: 'rahim', arabic: 'رَحِيم', transliteration: 'Rahim', meaning: 'Especially Merciful',
    example: { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', meaning: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', ref: 'Al-Fatihah 1:1' } },
  { id: 'yawm', arabic: 'يَوْم', transliteration: 'Yawm', meaning: 'Day',
    example: { arabic: 'مَالِكِ يَوْمِ الدِّينِ', meaning: 'Sovereign of the Day of Recompense.', ref: 'Al-Fatihah 1:4' } },
  { id: 'sirat', arabic: 'صِرَاط', transliteration: 'Sirat', meaning: 'Path, way',
    example: { arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', meaning: 'Guide us to the straight path.', ref: 'Al-Fatihah 1:6' } },
  { id: 'kitab', arabic: 'كِتَاب', transliteration: 'Kitab', meaning: 'Book',
    example: { arabic: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ', meaning: 'This is the Book about which there is no doubt.', ref: 'Al-Baqarah 2:2' } },
  { id: 'huda', arabic: 'هُدًى', transliteration: 'Huda', meaning: 'Guidance',
    example: { arabic: 'هُدًى لِّلْمُتَّقِينَ', meaning: 'A guidance for those conscious of Allah.', ref: 'Al-Baqarah 2:2' } },
  { id: 'salah', arabic: 'صَلَاة', transliteration: 'Salah', meaning: 'Prayer',
    example: { arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ', meaning: 'And establish prayer and give zakah.', ref: 'Al-Baqarah 2:43' } },
  { id: 'zakah', arabic: 'زَكَاة', transliteration: 'Zakah', meaning: 'Purifying charity',
    example: { arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ', meaning: 'And establish prayer and give zakah.', ref: 'Al-Baqarah 2:43' } },
  { id: 'sabr', arabic: 'صَبْر', transliteration: 'Sabr', meaning: 'Patience, steadfastness',
    example: { arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', meaning: 'Indeed, Allah is with the patient.', ref: 'Al-Baqarah 2:153' } },
  { id: 'ilm', arabic: 'عِلْم', transliteration: "'Ilm", meaning: 'Knowledge',
    example: { arabic: 'رَّبِّ زِدْنِي عِلْمًا', meaning: 'My Lord, increase me in knowledge.', ref: 'Ta-Ha 20:114' } },
  { id: 'nur', arabic: 'نُور', transliteration: 'Nur', meaning: 'Light',
    example: { arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', meaning: 'Allah is the Light of the heavens and the earth.', ref: 'An-Nur 24:35' } },
  { id: 'qalb', arabic: 'قَلْب', transliteration: 'Qalb', meaning: 'Heart',
    example: { arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', meaning: 'Unquestionably, by the remembrance of Allah hearts are assured.', ref: "Ar-Ra'd 13:28" } },
  { id: 'dhikr', arabic: 'ذِكْر', transliteration: 'Dhikr', meaning: 'Remembrance',
    example: { arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', meaning: 'Unquestionably, by the remembrance of Allah hearts are assured.', ref: "Ar-Ra'd 13:28" } },
  { id: 'rahmah', arabic: 'رَحْمَة', transliteration: 'Rahmah', meaning: 'Mercy',
    example: { arabic: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ', meaning: 'But My mercy encompasses all things.', ref: "Al-A'raf 7:156" } },
  { id: 'shukr', arabic: 'شُكْر', transliteration: 'Shukr', meaning: 'Gratitude',
    example: { arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', meaning: 'If you are grateful, I will surely increase you.', ref: 'Ibrahim 14:7' } },
  { id: 'shams', arabic: 'شَمْس', transliteration: 'Shams', meaning: 'Sun',
    example: { arabic: 'وَالشَّمْسِ وَضُحَاهَا', meaning: 'By the sun and its brightness.', ref: 'Ash-Shams 91:1' } },
  { id: 'qamar', arabic: 'قَمَر', transliteration: 'Qamar', meaning: 'Moon',
    example: { arabic: 'وَالْقَمَرِ إِذَا تَلَاهَا', meaning: 'And by the moon when it follows it.', ref: 'Ash-Shams 91:2' } },
  { id: 'layl', arabic: 'لَيْل', transliteration: 'Layl', meaning: 'Night',
    example: { arabic: 'وَاللَّيْلِ إِذَا يَغْشَىٰ', meaning: 'By the night when it covers.', ref: 'Al-Layl 92:1' } },
  { id: 'nas', arabic: 'نَاس', transliteration: 'Nas', meaning: 'People, mankind',
    example: { arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', meaning: 'Say, "I seek refuge in the Lord of mankind."', ref: 'An-Nas 114:1' } },
  { id: 'ghafur', arabic: 'غَفُور', transliteration: 'Ghafur', meaning: 'Forgiving',
    example: { arabic: 'وَهُوَ الْغَفُورُ الْوَدُودُ', meaning: 'And He is the Forgiving, the Affectionate.', ref: 'Al-Buruj 85:14' } },
  { id: 'salam', arabic: 'سَلَام', transliteration: 'Salam', meaning: 'Peace',
    example: { arabic: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ', meaning: 'Peace it is until the emergence of dawn.', ref: 'Al-Qadr 97:5' } },
  { id: 'khayr', arabic: 'خَيْر', transliteration: 'Khayr', meaning: 'Good',
    example: { arabic: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ', meaning: "So whoever does an atom's weight of good will see it.", ref: 'Az-Zalzalah 99:7' } },
  { id: 'azim', arabic: 'عَظِيم', transliteration: "'Azim", meaning: 'Great, tremendous',
    example: { arabic: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ', meaning: 'And indeed, you are of a great moral character.', ref: 'Al-Qalam 68:4' } },
  { id: 'ma', arabic: 'مَاء', transliteration: "Ma'", meaning: 'Water',
    example: { arabic: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ', meaning: 'And We made from water every living thing.', ref: "Al-Anbiya' 21:30" } },
  { id: 'ard', arabic: 'أَرْض', transliteration: 'Ard', meaning: 'Earth, land',
    example: { arabic: 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ', meaning: 'Indeed, in the creation of the heavens and the earth…', ref: "Al 'Imran 3:190" } },
  { id: 'sama', arabic: 'سَمَاء', transliteration: "Sama'", meaning: 'Sky, heaven' },
  { id: 'rasul', arabic: 'رَسُول', transliteration: 'Rasul', meaning: 'Messenger',
    example: { arabic: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ', meaning: 'Muhammad is the Messenger of Allah.', ref: 'Al-Fath 48:29' } },
  { id: 'nabiyy', arabic: 'نَبِيّ', transliteration: 'Nabiyy', meaning: 'Prophet' },
  { id: 'abd', arabic: 'عَبْد', transliteration: "'Abd", meaning: 'Servant, worshipper' },
  { id: 'jannah', arabic: 'جَنَّة', transliteration: 'Jannah', meaning: 'Garden; Paradise' },
  { id: 'nar', arabic: 'نَار', transliteration: 'Nar', meaning: 'Fire' },
  { id: 'nahar', arabic: 'نَهَار', transliteration: 'Nahar', meaning: 'Daytime' },
  { id: 'haqq', arabic: 'حَقّ', transliteration: 'Haqq', meaning: 'Truth, right' },
  { id: 'taqwa', arabic: 'تَقْوَى', transliteration: 'Taqwa', meaning: 'Mindfulness of Allah' },
  { id: 'tawbah', arabic: 'تَوْبَة', transliteration: 'Tawbah', meaning: 'Repentance' },
  { id: 'iman', arabic: 'إِيمَان', transliteration: 'Iman', meaning: 'Faith' },
  { id: 'amal', arabic: 'عَمَل', transliteration: "'Amal", meaning: 'Deed, action' },
  { id: 'ayah', arabic: 'آيَة', transliteration: 'Ayah', meaning: 'Sign; verse' },
];
