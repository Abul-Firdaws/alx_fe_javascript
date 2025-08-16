// Array to store all quotes with text and category properties
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "motivation" },
  { text: "Life is what happens to you while you're busy making other plans.", category: "life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "dreams" },
  { text: "It is during our darkest moments that we must focus to see the light.", category: "inspiration" },
  { text: "The only impossible journey is the one you never begin.", category: "motivation" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "success" },
  { text: "The way to get started is to quit talking and begin doing.", category: "action" },
  { text: "Don't let yesterday take up too much of today.", category: "life" },
  { text: "You learn more from failure than from success.", category: "learning" },
  { text: "It's not whether you get knocked down, it's whether you get up.", category: "resilience" }
];

// Function to display a random quote (required function name)
function showRandomQuote() {
  // Check if quotes array is not empty
  if (quotes.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = 
      '<p>No quotes available. Please add some quotes first.</p>';
    return;
  }
  
  // Generate random index to select a random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const selectedQuote = quotes[randomIndex];
  
  // Get the quote display container
  const quoteDisplay = document.getElementById('quoteDisplay');
  
  // Clear existing content
  quoteDisplay.innerHTML = '';
  
  // Create and append quote text element
  const quoteText = document.createElement('div');
  quoteText.className = 'quote-text';
  quoteText.textContent = `"${selectedQuote.text}"`;
  
  // Create and append category element
  const quoteCategory = document.createElement('div');
  quoteCategory.className = 'quote-category';
  quoteCategory.textContent = `Category: ${selectedQuote.category.charAt(0).toUpperCase() + selectedQuote.category.slice(1)}`;
  
  // Append elements to display container
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
  
  // Log for debugging
  console.log('Displaying quote:', selectedQuote);
}

// Function to create and show the add quote form (required function name)
function createAddQuoteForm() {
  const form = document.getElementById('addQuoteForm');
  
  // Remove hidden class to show the form
  form.classList.remove('hidden');
  
  // Focus on the first input field for better user experience
  document.getElementById('newQuoteText').focus();
}

// Function to add a new quote to the array and update DOM
function addQuote() {
  // Get input values and trim whitespace
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const quoteCategory = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
  
  // Validate that both fields have content
  if (!quoteText || !quoteCategory) {
    alert('Please fill in both the quote text and category.');
    return;
  }
  
  // Create new quote object
  const newQuote = {
    text: quoteText,
    category: quoteCategory
  };
  
  // Add new quote to the quotes array
  quotes.push(newQuote);
  
  // Clear the input fields
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  
  // Hide the form
  document.getElementById('addQuoteForm').classList.add('hidden');
  
  // Show success message in quote display
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = '<p style="color: green;">Quote added successfully! Click "Show New Quote" to see random quotes.</p>';
  
  // Log the addition for debugging
  console.log('Quote added:', newQuote);
  console.log('Total quotes:', quotes.length);
}

// Function to cancel adding a quote
function cancelAdd() {
  // Clear input fields
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  
  // Hide the form
  document.getElementById('addQuoteForm').classList.add('hidden');
}

// Event listeners setup when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add click event listener to "Show New Quote" button
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  
  // Add click event listener to "Add New Quote" button
  document.getElementById('toggleForm').addEventListener('click', createAddQuoteForm);
  
  // Add keyboard support for better user experience
  document.getElementById('newQuoteText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      // Move focus to category input when Enter is pressed
      document.getElementById('newQuoteCategory').focus();
    }
  });
  
  document.getElementById('newQuoteCategory').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      // Add quote when Enter is pressed in category field
      addQuote();
    }
  });
  
  console.log('DOM manipulation script loaded successfully');
  console.log('Initial quotes count:', quotes.length);
});