const countryData: Array<{
    code: string;
    phoneLength: number;
    pattern: RegExp;
  }> = [
    { code: '+1', phoneLength: 10, pattern: /^\d{10}$/ }, // USA & Canada
    { code: '+7', phoneLength: 10, pattern: /^[3489]\d{9}$/ }, // Russia
    { code: '+20', phoneLength: 10, pattern: /^[125]\d{8}$/ }, // Egypt
    { code: '+27', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // South Africa
    { code: '+30', phoneLength: 10, pattern: /^[2-9]\d{9}$/ }, // Greece
    { code: '+31', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // Netherlands
    { code: '+32', phoneLength: 9, pattern: /^[23456789]\d{8}$/ }, // Belgium
    { code: '+33', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // France
    { code: '+34', phoneLength: 9, pattern: /^[6789]\d{8}$/ }, // Spain
    { code: '+36', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // Hungary
    { code: '+39', phoneLength: 10, pattern: /^[3]\d{9}$/ }, // Italy
    { code: '+40', phoneLength: 9, pattern: /^[2-8]\d{8}$/ }, // Romania
    { code: '+41', phoneLength: 9, pattern: /^[2-9]\d{8}$/ }, // Switzerland
    { code: '+43', phoneLength: 10, pattern: /^[1-7]\d{9}$/ }, // Austria
    { code: '+44', phoneLength: 10, pattern: /^[1-9]\d{9}$/ }, // UK
    { code: '+45', phoneLength: 8, pattern: /^[2-9]\d{7}$/ }, // Denmark
    { code: '+46', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // Sweden
    { code: '+47', phoneLength: 8, pattern: /^[2-9]\d{7}$/ }, // Norway
    { code: '+48', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // Poland
    { code: '+49', phoneLength: 11, pattern: /^[1-9]\d{10}$/ }, // Germany
    { code: '+51', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Peru
    { code: '+52', phoneLength: 10, pattern: /^[1-9]\d{9}$/ }, // Mexico
    { code: '+54', phoneLength: 10, pattern: /^[11]\d{8}$/ }, // Argentina
    { code: '+55', phoneLength: 11, pattern: /^[1-9]{2}[9]\d{8}$/ }, // Brazil
    { code: '+56', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Chile
    { code: '+57', phoneLength: 10, pattern: /^[3]\d{9}$/ }, // Colombia
    { code: '+58', phoneLength: 10, pattern: /^[4]\d{9}$/ }, // Venezuela
    { code: '+60', phoneLength: 9, pattern: /^[1]\d{8}$/ }, // Malaysia
    { code: '+61', phoneLength: 9, pattern: /^[4]\d{8}$/ }, // Australia
    { code: '+62', phoneLength: 10, pattern: /^[8]\d{9}$/ }, // Indonesia
    { code: '+63', phoneLength: 10, pattern: /^[9]\d{9}$/ }, // Philippines
    { code: '+64', phoneLength: 9, pattern: /^[2]\d{8}$/ }, // New Zealand
    { code: '+65', phoneLength: 8, pattern: /^[689]\d{7}$/ }, // Singapore
    { code: '+66', phoneLength: 9, pattern: /^[8]\d{8}$/ }, // Thailand
    { code: '+81', phoneLength: 10, pattern: /^[7-9]\d{9}$/ }, // Japan
    { code: '+82', phoneLength: 10, pattern: /^[1]\d{9}$/ }, // South Korea
    { code: '+84', phoneLength: 9, pattern: /^[3-9]\d{8}$/ }, // Vietnam
    { code: '+86', phoneLength: 11, pattern: /^[1][3-9]\d{9}$/ }, // China
    { code: '+90', phoneLength: 10, pattern: /^[5]\d{9}$/ }, // Turkey
    { code: '+91', phoneLength: 10, pattern: /^[6-9]\d{9}$/ }, // India
    { code: '+92', phoneLength: 10, pattern: /^[3]\d{9}$/ }, // Pakistan
    { code: '+93', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Afghanistan
    { code: '+94', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Sri Lanka
    { code: '+95', phoneLength: 10, pattern: /^[9]\d{9}$/ }, // Myanmar
    { code: '+98', phoneLength: 10, pattern: /^[9]\d{9}$/ }, // Iran
    { code: '+212', phoneLength: 9, pattern: /^[6-7]\d{8}$/ }, // Morocco
    { code: '+213', phoneLength: 9, pattern: /^[5-7]\d{8}$/ }, // Algeria
    { code: '+216', phoneLength: 8, pattern: /^[2-9]\d{7}$/ }, // Tunisia
    { code: '+218', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Libya
    { code: '+220', phoneLength: 7, pattern: /^[2-9]\d{6}$/ }, // Gambia
    { code: '+221', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Senegal
    { code: '+222', phoneLength: 8, pattern: /^[4]\d{7}$/ }, // Mauritania
    { code: '+223', phoneLength: 8, pattern: /^[6-7]\d{7}$/ }, // Mali
    { code: '+224', phoneLength: 9, pattern: /^[6]\d{8}$/ }, // Guinea
    { code: '+225', phoneLength: 10, pattern: /^[0]\d{9}$/ }, // Côte d'Ivoire
    { code: '+226', phoneLength: 8, pattern: /^[5-7]\d{7}$/ }, // Burkina Faso
    { code: '+227', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Niger
    { code: '+228', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Togo
    { code: '+229', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Benin
    { code: '+230', phoneLength: 8, pattern: /^[5]\d{7}$/ }, // Mauritius
    { code: '+231', phoneLength: 7, pattern: /^[4-6]\d{6}$/ }, // Liberia
    { code: '+232', phoneLength: 8, pattern: /^[2-9]\d{7}$/ }, // Sierra Leone
    { code: '+233', phoneLength: 9, pattern: /^[2]\d{8}$/ }, // Ghana
    { code: '+234', phoneLength: 10, pattern: /^[7-9]\d{9}$/ }, // Nigeria
    { code: '+235', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Chad
    { code: '+236', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Central African Republic
    { code: '+237', phoneLength: 9, pattern: /^[6]\d{8}$/ }, // Cameroon
    { code: '+238', phoneLength: 7, pattern: /^[5-9]\d{6}$/ }, // Cape Verde
    { code: '+239', phoneLength: 7, pattern: /^[9]\d{6}$/ }, // São Tomé and Príncipe
    { code: '+240', phoneLength: 9, pattern: /^[222]\d{6}$/ }, // Equatorial Guinea
    { code: '+241', phoneLength: 7, pattern: /^[0-7]\d{6}$/ }, // Gabon
    { code: '+242', phoneLength: 9, pattern: /^[0]\d{8}$/ }, // Congo
    { code: '+243', phoneLength: 9, pattern: /^[8-9]\d{8}$/ }, // Democratic Republic of the Congo
    { code: '+244', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Angola
    { code: '+245', phoneLength: 7, pattern: /^[5-7]\d{6}$/ }, // Guinea-Bissau
    { code: '+246', phoneLength: 7, pattern: /^[2-9]\d{6}$/ }, // Diego Garcia
    { code: '+247', phoneLength: 4, pattern: /^\d{4}$/ }, // Ascension
    { code: '+248', phoneLength: 7, pattern: /^[2-8]\d{6}$/ }, // Seychelles
    { code: '+249', phoneLength: 9, pattern: /^[1]\d{8}$/ }, // Sudan
    { code: '+250', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Rwanda
    { code: '+251', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Ethiopia
    { code: '+252', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Somalia
    { code: '+253', phoneLength: 8, pattern: /^[77]\d{6}$/ }, // Djibouti
    { code: '+254', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Kenya
    { code: '+255', phoneLength: 9, pattern: /^[6-7]\d{8}$/ }, // Tanzania
    { code: '+256', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Uganda
    { code: '+257', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Burundi
    { code: '+258', phoneLength: 9, pattern: /^[8]\d{8}$/ }, // Mozambique
    { code: '+260', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Zambia
    { code: '+261', phoneLength: 9, pattern: /^[3]\d{8}$/ }, // Madagascar
    { code: '+262', phoneLength: 9, pattern: /^[639]\d{8}$/ }, // Réunion
    { code: '+263', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Zimbabwe
    { code: '+264', phoneLength: 9, pattern: /^[8]\d{8}$/ }, // Namibia
    { code: '+265', phoneLength: 9, pattern: /^[1-9]\d{8}$/ }, // Malawi
    { code: '+266', phoneLength: 8, pattern: /^[5-8]\d{7}$/ }, // Lesotho
    { code: '+267', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Botswana
    { code: '+268', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Eswatini
    { code: '+269', phoneLength: 7, pattern: /^[3]\d{6}$/ }, // Comoros
    { code: '+291', phoneLength: 7, pattern: /^[7]\d{6}$/ }, // Eritrea
    { code: '+297', phoneLength: 7, pattern: /^[5-6]\d{6}$/ }, // Aruba
    { code: '+298', phoneLength: 6, pattern: /^\d{6}$/ }, // Faroe Islands
    { code: '+299', phoneLength: 6, pattern: /^[2-9]\d{5}$/ }, // Greenland
    { code: '+350', phoneLength: 8, pattern: /^[5]\d{7}$/ }, // Gibraltar
    { code: '+351', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Portugal
    { code: '+352', phoneLength: 9, pattern: /^[6]\d{8}$/ }, // Luxembourg
    { code: '+353', phoneLength: 9, pattern: /^[8]\d{8}$/ }, // Ireland
    { code: '+354', phoneLength: 7, pattern: /^[6-8]\d{6}$/ }, // Iceland
    { code: '+355', phoneLength: 9, pattern: /^[6]\d{8}$/ }, // Albania
    { code: '+356', phoneLength: 8, pattern: /^[79]\d{7}$/ }, // Malta
    { code: '+357', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Cyprus
    { code: '+358', phoneLength: 9, pattern: /^[4-5]\d{8}$/ }, // Finland
    { code: '+359', phoneLength: 9, pattern: /^[8-9]\d{8}$/ }, // Bulgaria
    { code: '+370', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Lithuania
    { code: '+371', phoneLength: 8, pattern: /^[2]\d{7}$/ }, // Latvia
    { code: '+372', phoneLength: 8, pattern: /^[5]\d{7}$/ }, // Estonia
    { code: '+373', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Moldova
    { code: '+374', phoneLength: 8, pattern: /^[4]\d{7}$/ }, // Armenia
    { code: '+375', phoneLength: 9, pattern: /^[2-4]\d{8}$/ }, // Belarus
    { code: '+376', phoneLength: 6, pattern: /^[3-6]\d{5}$/ }, // Andorra
    { code: '+377', phoneLength: 8, pattern: /^[4-6]\d{7}$/ }, // Monaco
    { code: '+378', phoneLength: 10, pattern: /^[6]\d{9}$/ }, // San Marino
    { code: '+380', phoneLength: 9, pattern: /^[6-9]\d{8}$/ }, // Ukraine
  { code: '+381', phoneLength: 9, pattern: /^[6]\d{8}$/ }, // Serbia
  { code: '+382', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Montenegro
  { code: '+383', phoneLength: 8, pattern: /^[4]\d{7}$/ }, // Kosovo
  { code: '+385', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Croatia
  { code: '+386', phoneLength: 8, pattern: /^[3-7]\d{7}$/ }, // Slovenia
  { code: '+387', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Bosnia and Herzegovina
  { code: '+389', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // North Macedonia
  { code: '+420', phoneLength: 9, pattern: /^[6-7]\d{8}$/ }, // Czech Republic
  { code: '+421', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Slovakia
  { code: '+423', phoneLength: 7, pattern: /^[6]\d{6}$/ }, // Liechtenstein
  { code: '+500', phoneLength: 5, pattern: /^\d{5}$/ }, // Falkland Islands
  { code: '+501', phoneLength: 7, pattern: /^[6]\d{6}$/ }, // Belize
  { code: '+502', phoneLength: 8, pattern: /^[3-5]\d{7}$/ }, // Guatemala
  { code: '+503', phoneLength: 8, pattern: /^[67]\d{7}$/ }, // El Salvador
  { code: '+504', phoneLength: 8, pattern: /^[3-9]\d{7}$/ }, // Honduras
  { code: '+505', phoneLength: 8, pattern: /^[5678]\d{7}$/ }, // Nicaragua
  { code: '+506', phoneLength: 8, pattern: /^[5-8]\d{7}$/ }, // Costa Rica
  { code: '+507', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Panama
  { code: '+508', phoneLength: 6, pattern: /^[4-9]\d{5}$/ }, // Saint Pierre and Miquelon
  { code: '+509', phoneLength: 8, pattern: /^[3-4]\d{7}$/ }, // Haiti
  { code: '+590', phoneLength: 9, pattern: /^[69]\d{8}$/ }, // Guadeloupe
  { code: '+591', phoneLength: 8, pattern: /^[6-7]\d{7}$/ }, // Bolivia
  { code: '+592', phoneLength: 7, pattern: /^[6]\d{6}$/ }, // Guyana
  { code: '+593', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Ecuador
  { code: '+595', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Paraguay
  { code: '+597', phoneLength: 7, pattern: /^[6]\d{6}$/ }, // Suriname
  { code: '+598', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Uruguay
  { code: '+599', phoneLength: 7, pattern: /^[9]\d{6}$/ }, // Curaçao and Caribbean Netherlands
  { code: '+670', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Timor-Leste
  { code: '+672', phoneLength: 6, pattern: /^[1-9]\d{5}$/ }, // Norfolk Island
  { code: '+673', phoneLength: 7, pattern: /^[7-8]\d{6}$/ }, // Brunei
  { code: '+674', phoneLength: 7, pattern: /^[4-5]\d{6}$/ }, // Nauru
  { code: '+675', phoneLength: 8, pattern: /^[7]\d{7}$/ }, // Papua New Guinea
  { code: '+676', phoneLength: 7, pattern: /^[7]\d{6}$/ }, // Tonga
  { code: '+677', phoneLength: 7, pattern: /^[7-9]\d{6}$/ }, // Solomon Islands
  { code: '+678', phoneLength: 7, pattern: /^[5-7]\d{6}$/ }, // Vanuatu
  { code: '+679', phoneLength: 7, pattern: /^[7]\d{6}$/ }, // Fiji
  { code: '+680', phoneLength: 7, pattern: /^[2-8]\d{6}$/ }, // Palau
  { code: '+681', phoneLength: 6, pattern: /^[5-7]\d{5}$/ }, // Wallis and Futuna
  { code: '+682', phoneLength: 5, pattern: /^[5]\d{4}$/ }, // Cook Islands
  { code: '+683', phoneLength: 4, pattern: /^\d{4}$/ }, // Niue
  { code: '+685', phoneLength: 7, pattern: /^[7]\d{6}$/ }, // Samoa
  { code: '+686', phoneLength: 8, pattern: /^[2-5]\d{7}$/ }, // Kiribati
  { code: '+687', phoneLength: 6, pattern: /^[5-9]\d{5}$/ }, // New Caledonia
  { code: '+688', phoneLength: 6, pattern: /^[9]\d{5}$/ }, // Tuvalu
  { code: '+689', phoneLength: 8, pattern: /^[8]\d{7}$/ }, // French Polynesia
  { code: '+690', phoneLength: 4, pattern: /^\d{4}$/ }, // Tokelau
  { code: '+691', phoneLength: 7, pattern: /^[3-9]\d{6}$/ }, // Micronesia
  { code: '+692', phoneLength: 7, pattern: /^[2-6]\d{6}$/ }, // Marshall Islands
  { code: '+850', phoneLength: 9, pattern: /^[1]\d{8}$/ }, // North Korea
  { code: '+852', phoneLength: 8, pattern: /^[5-9]\d{7}$/ }, // Hong Kong
  { code: '+853', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Macau
  { code: '+855', phoneLength: 9, pattern: /^[1]\d{8}$/ }, // Cambodia
  { code: '+856', phoneLength: 10, pattern: /^[2]\d{9}$/ }, // Laos
  { code: '+880', phoneLength: 10, pattern: /^[1]\d{9}$/ }, // Bangladesh
  { code: '+886', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Taiwan
  { code: '+960', phoneLength: 7, pattern: /^[7-9]\d{6}$/ }, // Maldives
  { code: '+961', phoneLength: 8, pattern: /^[3-6]\d{7}$/ }, // Lebanon
  { code: '+962', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Jordan
  { code: '+963', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Syria
  { code: '+964', phoneLength: 10, pattern: /^[7]\d{9}$/ }, // Iraq
  { code: '+965', phoneLength: 8, pattern: /^[5-9]\d{7}$/ }, // Kuwait
  { code: '+966', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // Saudi Arabia
  { code: '+967', phoneLength: 9, pattern: /^[7]\d{8}$/ }, // Yemen
  { code: '+968', phoneLength: 8, pattern: /^[9]\d{7}$/ }, // Oman
  { code: '+970', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // Palestine
  { code: '+971', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // United Arab Emirates
  { code: '+972', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // Israel
  { code: '+973', phoneLength: 8, pattern: /^[3]\d{7}$/ }, // Bahrain
  { code: '+974', phoneLength: 8, pattern: /^[3]\d{7}$/ }, // Qatar
  { code: '+975', phoneLength: 8, pattern: /^[1-7]\d{7}$/ }, // Bhutan
  { code: '+976', phoneLength: 8, pattern: /^[8-9]\d{7}$/ }, // Mongolia
  { code: '+977', phoneLength: 10, pattern: /^[9]\d{9}$/ }, // Nepal
  { code: '+992', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // Tajikistan
  { code: '+993', phoneLength: 8, pattern: /^[6]\d{7}$/ }, // Turkmenistan
  { code: '+994', phoneLength: 9, pattern: /^[4-9]\d{8}$/ }, // Azerbaijan
  { code: '+995', phoneLength: 9, pattern: /^[5]\d{8}$/ }, // Georgia
  { code: '+996', phoneLength: 9, pattern: /^[5-8]\d{8}$/ }, // Kyrgyzstan
  { code: '+998', phoneLength: 9, pattern: /^[9]\d{8}$/ }, // Uzbekistan
];

export default countryData;