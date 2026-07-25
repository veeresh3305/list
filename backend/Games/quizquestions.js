// Question bank for the multiplayer Quiz feature.
// Each question: { q: "text", options: [4 strings], correct: indexOfCorrectOption }
// Keep correct-answer indices OUT of anything emitted to clients until scoring time.

const QUIZ_BANK = {
  "General Knowledge": [
    { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
    { q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correct: 2 },
    { q: "What is the largest planet in our solar system?", options: ["Earth", "Saturn", "Jupiter", "Neptune"], correct: 2 },
    { q: "Which language has the most native speakers worldwide?", options: ["English", "Mandarin Chinese", "Spanish", "Hindi"], correct: 1 },
    { q: "What gas do plants primarily absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2 },
    { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correct: 1 },
    { q: "What is the smallest country in the world by area?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correct: 2 },
    { q: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { q: "Who wrote the theory of relativity?", options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo Galilei"], correct: 1 },
    { q: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Ringgit"], correct: 2 },
    { q: "Which metal is liquid at room temperature?", options: ["Lead", "Mercury", "Tin", "Zinc"], correct: 1 },
    { q: "How many time zones does mainland Russia span?", options: ["7", "9", "11", "13"], correct: 2 }
  ],
  "Movies": [
    { q: "Which movie features the line \"I'll be back\"?", options: ["Predator", "The Terminator", "RoboCop", "Total Recall"], correct: 1 },
    { q: "Who directed 'Jurassic Park' (1993)?", options: ["James Cameron", "George Lucas", "Steven Spielberg", "Ridley Scott"], correct: 2 },
    { q: "Which studio produces the Toy Story films?", options: ["DreamWorks", "Pixar", "Illumination", "Blue Sky"], correct: 1 },
    { q: "What is the name of the wizarding school in Harry Potter?", options: ["Hogwarts", "Durmstrang", "Beauxbatons", "Ilvermorny"], correct: 0 },
    { q: "Which actor played Iron Man in the Marvel Cinematic Universe?", options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"], correct: 2 },
    { q: "'The Godfather' is primarily set in which city?", options: ["Chicago", "New York City", "Boston", "Las Vegas"], correct: 1 },
    { q: "Which film won the Academy Award for Best Picture in 2020?", options: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"], correct: 2 },
    { q: "In 'Finding Nemo', what kind of fish is Nemo?", options: ["Blue Tang", "Clownfish", "Angelfish", "Pufferfish"], correct: 1 },
    { q: "Who played the Joker in 'The Dark Knight' (2008)?", options: ["Jared Leto", "Joaquin Phoenix", "Heath Ledger", "Jack Nicholson"], correct: 2 },
    { q: "Which of these is NOT a Christopher Nolan film?", options: ["Inception", "Interstellar", "Gladiator", "Tenet"], correct: 2 },
    { q: "What is the highest-grossing film of all time (unadjusted)?", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"], correct: 0 },
    { q: "Which animated film features a snowman named Olaf?", options: ["Moana", "Frozen", "Tangled", "Encanto"], correct: 1 }
  ],
  "Sports": [
    { q: "How many players are on a standard soccer team on the field?", options: ["9", "10", "11", "12"], correct: 2 },
    { q: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Basketball", "Tennis", "Badminton"], correct: 1 },
    { q: "How often are the Summer Olympic Games held?", options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], correct: 2 },
    { q: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Italy", "Brazil"], correct: 3 },
    { q: "In tennis, what is a score of zero called?", options: ["Nil", "Love", "Duck", "Blank"], correct: 1 },
    { q: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], correct: 1 },
    { q: "What sport is associated with the term 'strike zone'?", options: ["Cricket", "Baseball", "Bowling", "Golf"], correct: 1 },
    { q: "How many points is a touchdown worth in American football?", options: ["3", "6", "7", "8"], correct: 1 },
    { q: "Which country hosted the 2016 Summer Olympics?", options: ["China", "United Kingdom", "Brazil", "Japan"], correct: 2 },
    { q: "In golf, what is one stroke under par called?", options: ["Bogey", "Eagle", "Birdie", "Albatross"], correct: 2 },
    { q: "Which sport uses a shuttlecock?", options: ["Table Tennis", "Squash", "Badminton", "Racquetball"], correct: 2 },
    { q: "How many players are on the court for one basketball team during play?", options: ["4", "5", "6", "7"], correct: 1 }
  ],
  "Music": [
    { q: "Which instrument has 88 keys?", options: ["Organ", "Piano", "Harpsichord", "Accordion"], correct: 1 },
    { q: "Which band released the album 'Abbey Road'?", options: ["The Rolling Stones", "The Beatles", "Pink Floyd", "The Who"], correct: 1 },
    { q: "Who is known as the 'King of Pop'?", options: ["Prince", "Elvis Presley", "Michael Jackson", "Usher"], correct: 2 },
    { q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], correct: 2 },
    { q: "Which artist released the song 'Shape of You'?", options: ["Justin Bieber", "Ed Sheeran", "Shawn Mendes", "Charlie Puth"], correct: 1 },
    { q: "What does 'BPM' stand for in music?", options: ["Beats Per Minute", "Bars Per Measure", "Beats Per Measure", "Bars Per Minute"], correct: 0 },
    { q: "Which pop star's albums include 'Lover' and 'Folklore'?", options: ["Ariana Grande", "Taylor Swift", "Billie Eilish", "Dua Lipa"], correct: 1 },
    { q: "What genre is most associated with Bob Marley?", options: ["Jazz", "Reggae", "Blues", "Funk"], correct: 1 },
    { q: "Which K-pop group performs 'Dynamite' and 'Butter'?", options: ["EXO", "Blackpink", "BTS", "Seventeen"], correct: 2 },
    { q: "Beethoven was primarily what kind of composer?", options: ["Baroque", "Classical/Romantic", "Modernist", "Renaissance"], correct: 1 },
    { q: "Which instrument family does the violin belong to?", options: ["Woodwind", "Percussion", "Brass", "String"], correct: 3 },
    { q: "Who sang the original version of 'I Will Always Love You'?", options: ["Whitney Houston", "Dolly Parton", "Celine Dion", "Mariah Carey"], correct: 1 }
  ]
};

module.exports = QUIZ_BANK;