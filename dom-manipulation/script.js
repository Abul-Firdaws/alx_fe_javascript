// Array to store all quotes with text and category properties
let quotes = [];

// Default quotes to initialize the application
const defaultQuotes = [
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

// Local Storage Functions
function saveQuotes() {
  try {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    updateStorageInfo();
    console.log('Quotes saved to localStorage');
  } catch (error) {
    console.error('Error saving quotes to localStorage:', error);
    alert('Error saving quotes. Your browser may have storage limitations.');
  }
}

function loadQuotes() {
  try {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
      quotes = JSON.parse(storedQuotes);
      console.log('Quotes loaded from localStorage:', quotes.length);
    } else {
      // If no quotes in storage, use default quotes
      quotes = [...defaultQuotes];
      saveQuotes(); // Save default quotes to localStorage
      console.log('No stored quotes found. Using default quotes.');
    }
  } catch (error) {
    console.error('Error loading quotes from localStorage:', error);
    quotes = [...defaultQuotes];
    console.log('Error loading quotes. Using default quotes.');
  }
}

// Session Storage Functions
function saveToSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
}

function getFromSessionStorage(key) {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return null;
  }
}

function saveLastViewedQuote(quote) {
  const timestamp = new Date().toLocaleString();
  const lastViewed = {
    quote: quote,
    timestamp: timestamp
  };
  saveToSessionStorage('lastViewedQuote', lastViewed);
  updateLastViewedDisplay(timestamp);
}

function loadLastViewedQuote() {
  const lastViewed = getFromSessionStorage('lastViewedQuote');
  if (lastViewed) {
    updateLastViewedDisplay(lastViewed.timestamp);
    return lastViewed.quote;
  }
  return null;
}

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
  
  // Save to session storage as last viewed quote
  saveLastViewedQuote(selectedQuote);
  
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
  
  // Check for duplicate quotes
  const isDuplicate = quotes.some(quote => 
    quote.text.toLowerCase() === quoteText.toLowerCase() && 
    quote.category.toLowerCase() === quoteCategory.toLowerCase()
  );
  
  if (isDuplicate) {
    alert('This quote already exists in the selected category.');
    return;
  }
  
  // Create new quote object
  const newQuote = {
    text: quoteText,
    category: quoteCategory
  };
  
  // Add new quote to the quotes array
  quotes.push(newQuote);
  
  // Save to localStorage
  saveQuotes();
  
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

// JSON Export Function
function exportToJsonFile() {
  try {
    // Convert quotes array to JSON string with proper formatting
    const jsonData = JSON.stringify(quotes, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `quotes_export_${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the temporary URL
    URL.revokeObjectURL(url);
    
    alert('Quotes exported successfully!');
    console.log('Exported', quotes.length, 'quotes');
  } catch (error) {
    console.error('Error exporting quotes:', error);
    alert('Error exporting quotes. Please try again.');
  }
}

// JSON Import Function (required function name from assignment)
function importFromJsonFile(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    alert('Please select a valid JSON file.');
    return;
  }
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      
      // Validate imported data structure
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Invalid file format. Expected an array of quotes.');
      }
      
      // Validate each quote object
      const validQuotes = importedQuotes.filter(quote => {
        return quote && 
               typeof quote.text === 'string' && 
               typeof quote.category === 'string' && 
               quote.text.trim() !== '' && 
               quote.category.trim() !== '';
      });
      
      if (validQuotes.length === 0) {
        throw new Error('No valid quotes found in the file.');
      }
      
      // Filter out duplicates
      const newQuotes = validQuotes.filter(importedQuote => {
        return !quotes.some(existingQuote => 
          existingQuote.text.toLowerCase() === importedQuote.text.toLowerCase() &&
          existingQuote.category.toLowerCase() === importedQuote.category.toLowerCase()
        );
      });
      
      if (newQuotes.length === 0) {
        alert('All quotes from the file already exist in your collection.');
        return;
      }
      
      // Add new quotes to the array
      quotes.push(...newQuotes);
      
      // Save to localStorage
      saveQuotes();
      
      // Show success message
      alert(`${newQuotes.length} quotes imported successfully! (${validQuotes.length - newQuotes.length} duplicates skipped)`);
      
      // Update display
      const quoteDisplay = document.getElementById('quoteDisplay');
      quoteDisplay.innerHTML = `<p style="color: green;">${newQuotes.length} new quotes imported successfully!</p>`;
      
      console.log('Import successful:', newQuotes.length, 'new quotes added');
      
    } catch (error) {
      console.error('Error importing quotes:', error);
      alert('Error importing quotes: ' + error.message);
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  fileReader.onerror = function() {
    alert('Error reading the file. Please try again.');
  };
  
  fileReader.readAsText(file);
}

// Clear all data function
function clearAllData() {
  const confirmation = confirm('Are you sure you want to clear all quotes and data? This action cannot be undone.');
  
  if (confirmation) {
    // Clear arrays
    quotes = [];
    
    // Clear localStorage
    localStorage.removeItem('quotes');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset display
    document.getElementById('quoteDisplay').innerHTML = 
      '<p>All data cleared. Add some quotes to get started!</p>';
    
    // Update storage info
    updateStorageInfo();
    updateLastViewedDisplay('None');
    
    alert('All data has been cleared successfully.');
    console.log('All data cleared');
  }
}

// Update storage information display
function updateStorageInfo() {
  // Update quote count
  document.getElementById('quoteCount').textContent = quotes.length;
  
  // Check localStorage support and usage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    document.getElementById('storageStatus').textContent = 'Available';
  } catch (error) {
    document.getElementById('storageStatus').textContent = 'Not Available';
  }
}

// Update last viewed display
function updateLastViewedDisplay(timestamp) {
  document.getElementById('lastViewed').textContent = timestamp;
}

// Event listeners setup when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load quotes from localStorage on page load
  loadQuotes();
  
  // Load last viewed quote from sessionStorage
  loadLastViewedQuote();
  
  // Update storage info display
  updateStorageInfo();
  
  // Add click event listener to "Show New Quote" button
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  
  // Add click event listener to "Add New Quote" button
  document.getElementById('toggleForm').addEventListener('click', createAddQuoteForm);
  
  // Add click event listener to "Export Quotes" button
  document.getElementById('exportQuotes').addEventListener('click', exportToJsonFile);
  
  // Add click event listener to "Clear All Data" button
  document.getElementById('clearStorage').addEventListener('click', clearAllData);
  
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
  
  // Handle page unload to save session data
  window.addEventListener('beforeunload', function() {
    // Save any pending session data
    saveToSessionStorage('sessionEnded', new Date().toISOString());
  });
  
  console.log('DOM manipulation script with web storage loaded successfully');
  console.log('Initial quotes count:', quotes.length);
});