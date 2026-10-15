/* The 18 combat sports used by the Competition portal. */
window.SPORTS = [
  { id: 'aikido',     name: 'Aikido',     icon: 'shield',   color: '#00D4FF', description: 'The way of unifying with life energy.' },
  { id: 'boxing',     name: 'Boxing',     icon: 'box',      color: '#FF3D00', description: 'The sweet science of pugilism.' },
  { id: 'hapkido',    name: 'Hapkido',    icon: 'zap',      color: '#7B3FF2', description: 'The way of coordinated power.' },
  { id: 'judo',       name: 'Judo',       icon: 'users',    color: '#4CAF50', description: 'The gentle way of using force.' },
  { id: 'jujitsu',    name: 'Ju-Jitsu',   icon: 'activity', color: '#2196F3', description: 'The art of softness and yielding.' },
  { id: 'karate',     name: 'Karate',     icon: 'flame',    color: '#F44336', description: 'The way of the empty hand.' },
  { id: 'kempo',      name: 'Kempo',      icon: 'target',   color: '#FF9800', description: 'The law of the fist.' },
  { id: 'kendo',      name: 'Kendo',      icon: 'sword',    color: '#9C27B0', description: 'The way of the sword.' },
  { id: 'kickboxing', name: 'Kickboxing', icon: 'zap',      color: '#FFEB3B', description: 'High-intensity striking sport.' },
  { id: 'mma',        name: 'MMA',        icon: 'trophy',   color: '#607D8B', description: 'Mixed Martial Arts competition.' },
  { id: 'muaythai',   name: 'Muaythai',   icon: 'flame',    color: '#E91E63', description: 'The art of eight limbs.' },
  { id: 'sambo',      name: 'Sambo',      icon: 'shield',   color: '#3F51B5', description: 'Self-defense without weapons.' },
  { id: 'silambam',   name: 'Silambam',   icon: 'sword',    color: '#795548', description: 'Traditional staff-based martial art.' },
  { id: 'silat',      name: 'Silat',      icon: 'triangle', color: '#009688', description: 'Southeast Asian martial arts.' },
  { id: 'sumo',       name: 'Sumo',       icon: 'circle',   color: '#FF5722', description: 'Traditional Japanese wrestling.' },
  { id: 'taekwondo',  name: 'Taekwondo',  icon: 'zap',      color: '#03A9F4', description: 'The way of kicking and punching.' },
  { id: 'wrestling',  name: 'Wrestling',  icon: 'users',    color: '#FFC107', description: 'Grappling and ground combat.' },
  { id: 'wushu',      name: 'Wushu',      icon: 'star',     color: '#FFD700', description: 'Chinese traditional martial arts.' }
];
window.getSport = function (id) {
  return window.SPORTS.find(function (s) { return s.id === id; });
};
/* Read ?sport=karate from the URL (falls back to taekwondo like the original app) */
window.currentSportId = function () {
  return new URLSearchParams(location.search).get('sport') || 'taekwondo';
};
