const sampleQuestions = [
  // Aptitude Questions
  {
    questionText: "If a train travels 360 kilometers in 4 hours, what is its speed in kilometers per hour?",
    options: ["80 km/h", "90 km/h", "85 km/h", "95 km/h"],
    correctAnswer: 0,
    category: "Aptitude",
    difficulty: "Easy",
    explanation: "Speed = Distance/Time = 360/4 = 90 km/h"
  },
  {
    questionText: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    correctAnswer: 1,
    category: "Aptitude",
    difficulty: "Easy",
    explanation: "15% of 200 = (15/100) × 200 = 30"
  },
  {
    questionText: "If 6 workers can complete a task in 12 days, how many days will it take for 8 workers to complete the same task?",
    options: ["9 days", "10 days", "8 days", "7 days"],
    correctAnswer: 0,
    category: "Aptitude",
    difficulty: "Medium",
    explanation: "(6 × 12) = (8 × x), where x is the answer. Therefore, x = (6 × 12)/8 = 9 days"
  },

  // Logical Reasoning Questions
  {
    questionText: "If all flowers are plants, and all roses are flowers, which statement must be true?",
    options: [
      "All plants are flowers",
      "All roses are plants",
      "All flowers are roses",
      "None of the above"
    ],
    correctAnswer: 1,
    category: "Logical Reasoning",
    difficulty: "Medium",
    explanation: "This is a syllogism. If A includes B, and B includes C, then A must include C."
  },
  {
    questionText: "In a row of children, if A is 8th from the left and 4th from the right, how many children are there in the row?",
    options: ["11", "12", "13", "10"],
    correctAnswer: 0,
    category: "Logical Reasoning",
    difficulty: "Easy",
    explanation: "Position from left + Position from right - 1 = Total children. Therefore, 8 + 4 - 1 = 11"
  },
  {
    questionText: "Complete the series: 2, 6, 12, 20, ?",
    options: ["30", "28", "32", "25"],
    correctAnswer: 0,
    category: "Logical Reasoning",
    difficulty: "Medium",
    explanation: "The pattern is adding consecutive even numbers: +4, +6, +8, +10"
  },

  // Technical Questions
  {
    questionText: "Which of the following is NOT a JavaScript data type?",
    options: ["String", "Boolean", "Integer", "Undefined"],
    correctAnswer: 2,
    category: "Technical",
    difficulty: "Easy",
    explanation: "JavaScript has Number type instead of Integer. The basic types are: String, Number, Boolean, Undefined, Null, Object"
  },
  {
    questionText: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Creative Style System",
      "Cascading Style Sheets",
      "Colorful Style Sheets"
    ],
    correctAnswer: 2,
    category: "Technical",
    difficulty: "Easy",
    explanation: "CSS stands for Cascading Style Sheets, which is used to style HTML documents"
  },
  {
    questionText: "Which HTTP status code indicates a successful request?",
    options: ["200", "404", "500", "301"],
    correctAnswer: 0,
    category: "Technical",
    difficulty: "Medium",
    explanation: "200 OK status code indicates that the request has succeeded"
  },

  // General Knowledge Questions
  {
    questionText: "Which is the largest planet in our solar system?",
    options: ["Mars", "Saturn", "Jupiter", "Neptune"],
    correctAnswer: 2,
    category: "General Knowledge",
    difficulty: "Easy",
    explanation: "Jupiter is the largest planet in our solar system"
  },
  {
    questionText: "Who wrote 'Romeo and Juliet'?",
    options: [
      "Charles Dickens",
      "William Shakespeare",
      "Jane Austen",
      "Mark Twain"
    ],
    correctAnswer: 1,
    category: "General Knowledge",
    difficulty: "Easy",
    explanation: "Romeo and Juliet was written by William Shakespeare"
  },
  {
    questionText: "What is the chemical symbol for gold?",
    options: ["Ag", "Fe", "Au", "Cu"],
    correctAnswer: 2,
    category: "General Knowledge",
    difficulty: "Medium",
    explanation: "Au (from Latin 'aurum') is the chemical symbol for gold"
  }
];

module.exports = sampleQuestions; 