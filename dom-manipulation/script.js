// Current filter state
let currentFilter = 'all';
let filteredQuotes = [];

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

function saveLastFilter(filterValue) {
  try {
    localStorage.setItem('lastSelectedFilter', filterValue);
    console.log('Filter preference saved:', filterValue);
  } catch (error) {
    console.error('Error saving filter preference:', error);
  }
}

function loadLastFilter() {
  try {
    const lastFilter = localStorage.getItem('lastSelectedFilter');
    return lastFilter || 'all';
  } catch (error) {
    console.error('Error loading filter preference:', error);
    return 'all';
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
    
    // Initialize filtered quotes array
    filteredQuotes = [...quotes];
    
    // Populate categories after loading quotes
    populateCategories();
    
    // Load and apply last filter
    const lastFilter = loadLastFilter();
    currentFilter = lastFilter;
    document.getElementById('categoryFilter').value = lastFilter;
    
    // Apply the loaded filter
    filterQuotes();
    
  } catch (error) {
    console.error('Error loading quotes from localStorage:', error);
    quotes = [...defaultQuotes];
    filteredQuotes = [...quotes];
    populateCategories();
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

// Function to get unique categories from quotes array
function getUniqueCategories() {
  const categories = [...new Set(quotes.map(quote => quote.category.toLowerCase()))];
  return categories.sort();
}

// Function to populate categories dynamically (required function name)
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = getUniqueCategories();
  
  // Store current selection to preserve it
  const currentSelection = categoryFilter.value;
  
  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  
  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (categories.includes(currentSelection) || currentSelection === 'all') {
    categoryFilter.value = currentSelection;
  }
  
  // Update category tags display
  updateCategoryTags(categories);
  
  console.log('Categories populated:', categories);
}

// Function to update category tags display
function updateCategoryTags(categories) {
  const categoryTags = document.getElementById('categoryTags');
  
  if (!categoryTags) return; // Skip if element doesn't exist (for basic HTML version)
  
  categoryTags.innerHTML = '';
  
  if (categories.length === 0) {
    categoryTags.innerHTML = '<span style="color: #999;">No categories yet</span>';
    return;
  }
  
  categories.forEach(category => {
    const tag = document.createElement('span');
    tag.className = 'category-tag';
    tag.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Add quote count for each category
    const count = quotes.filter(quote => quote.category.toLowerCase() === category).length;
    tag.textContent += ` (${count})`;
    
    categoryTags.appendChild(tag);
  });
}

// Function to filter quotes based on selected category (required function name)
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  currentFilter = selectedCategory;
  
  // Save filter preference
  saveLastFilter(selectedCategory);
  
  // Update filtered quotes array
  if (selectedCategory === 'all') {
    filteredQuotes = [...quotes];
  } else {
    filteredQuotes = quotes.filter(quote => 
      quote.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  
  // Update filter status display
  updateFilterStatus();
  
  // If there are filtered quotes, show a random one
  if (filteredQuotes.length > 0) {
    showRandomQuote();
  } else {
    document.getElementById('quoteDisplay').innerHTML = 
      '<p>📭 No quotes found for this category. Try adding some quotes!</p>';
  }
  
  console.log('Filtered quotes:', filteredQuotes.length, 'out of', quotes.length);
}

// Function to update filter status display
function updateFilterStatus() {
  const filterStatus = document.getElementById('filterStatus');
  const activeFilter = document.getElementById('activeFilter');
  
  if (currentFilter === 'all') {
    if (filterStatus) filterStatus.textContent = `Showing all ${quotes.length} quotes`;
    if (activeFilter) activeFilter.textContent = 'All Categories';
  } else {
    const categoryName = currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1);
    if (filterStatus) filterStatus.textContent = `Showing ${filteredQuotes.length} quotes in "${categoryName}"`;
    if (activeFilter) activeFilter.textContent = categoryName;
  }
}

// Function to reset filter
function resetFilter() {
  document.getElementById('categoryFilter').value = 'all';
  currentFilter = 'all';
  filteredQuotes = [...quotes];
  saveLastFilter('all');
  updateFilterStatus();
  
  if (quotes.length > 0) {
    showRandomQuote();
  }
}

// Function to display a random quote (required function name)
function showRandomQuote() {
  // Use filtered quotes if a filter is active
  const quotesToUse = filteredQuotes.length > 0 ? filteredQuotes : quotes;
  
  // Check if quotes array is not empty
  if (quotesToUse.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = 
      '<p>No quotes available. Please add some quotes first.</p>';
    return;
  }
  
  // Generate random index to select a random quote
  const randomIndex = Math.floor(Math.random() * quotesToUse.length);
  const selectedQuote = quotesToUse[randomIndex];
  
  // Get the quote display container
  const quoteDisplay = document.getElementById('quoteDisplay');
  
  // Clear existing content
  quoteDisplay.innerHTML = '';
  
  // Add filtered class if filter is active
  if (currentFilter !== 'all') {
    quoteDisplay.classList.add('quote-display-filtered');
  } else {
    quoteDisplay.classList.remove('quote-display-filtered');
  }
  
  // Create and append quote text element
  const quoteText = document.createElement('div');
  quoteText.className = 'quote-text';
  quoteText.textContent = `"${selectedQuote.text}"`;
  
  // Create and append category element
  const quoteCategory = document.createElement('div');
  quoteCategory.className = 'quote-category';
  quoteCategory.textContent = `Category: ${selectedQuote.category.charAt(0).toUpperCase() + selectedQuote.category.slice(1)}`;
  
  // Add filter indication if applicable
  if (currentFilter !== 'all') {
    const filterIndication = document.createElement('div');
    filterIndication.style.fontSize = '12px';
    filterIndication.style.color = '#666';
    filterIndication.style.marginTop = '10px';
    filterIndication.textContent = `🔍 Filtered by: ${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}`;
    quoteDisplay.appendChild(filterIndication);
  }
  
  // Append elements to display container
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
  
  // Save to session storage as last viewed quote
  saveLastViewedQuote(selectedQuote);
  
  // Log for debugging
  console.log('Displaying quote:', selectedQuote);
  console.log('From filtered set:', quotesToUse.length, 'quotes');
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
  
  // Update categories dropdown (required for new categories)
  populateCategories();
  
  // Update filtered quotes if the new quote matches current filter
  if (currentFilter === 'all' || currentFilter === quoteCategory.toLowerCase()) {
    filteredQuotes = currentFilter === 'all' ? [...quotes] : 
      quotes.filter(quote => quote.category.toLowerCase() === currentFilter);
    updateFilterStatus();
  }
  
  // Clear the input fields
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  
  // Hide the form
  document.getElementById('addQuoteForm').classList.add('hidden');
  
  // Show success message with category info
  const quoteDisplay = document.getElementById('quoteDisplay');
  const categoryName = quoteCategory.charAt(0).toUpperCase() + quoteCategory.slice(1);
  quoteDisplay.innerHTML = `<p style="color: green;">✅ Quote added successfully to "${categoryName}" category! Click "Show New Quote" to see random quotes.</p>`;
  
  // Log the addition for debugging
  console.log('Quote added:', newQuote);
  console.log('Total quotes:', quotes.length);
  console.log('Categories updated');
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
      
      // Update categories and apply current filter
      populateCategories();
      filterQuotes(); // This will update filteredQuotes based on current filter
      
      // Show success message
      alert(`${newQuotes.length} quotes imported successfully! (${validQuotes.length - newQuotes.length} duplicates skipped)`);
      
      // Update display
      const quoteDisplay = document.getElementById('quoteDisplay');
      quoteDisplay.innerHTML = `<p style="color: green;">✅ ${newQuotes.length} new quotes imported successfully!</p>`;
      
      console.log('Import successful:', newQuotes.length, 'new quotes added');
      console.log('Categories updated after import');
      
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
    filteredQuotes = [];
    currentFilter = 'all';
    
    // Clear localStorage
    localStorage.removeItem('quotes');
    localStorage.removeItem('lastSelectedFilter');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset filter dropdown
    document.getElementById('categoryFilter').value = 'all';
    
    // Reset display
    document.getElementById('quoteDisplay').innerHTML = 
      '<p>🔄 All data cleared. Add some quotes to get started!</p>';
    
    // Update all displays
    populateCategories();
    updateStorageInfo();
    updateFilterStatus();
    updateLastViewedDisplay('None');
    
    alert('All data has been cleared successfully.');
    console.log('All data cleared');
  }
}

// Update storage information display
function updateStorageInfo() {
  // Update quote count
  const quoteCount = document.getElementById('quoteCount');
  if (quoteCount) quoteCount.textContent = quotes.length;
  
  // Check localStorage support and usage
  const storageStatus = document.getElementById('storageStatus');
  if (storageStatus) {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      storageStatus.textContent = 'Available';
    } catch (error) {
      storageStatus.textContent = 'Not Available';
    }
  }
}

// Update last viewed display
function updateLastViewedDisplay(timestamp) {
  const lastViewed = document.getElementById('lastViewed');
  if (lastViewed) lastViewed.textContent = timestamp;
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
  
  // Add click event listener to "Export Quotes" button (if exists)
  const exportButton = document.getElementById('exportQuotes');
  if (exportButton) exportButton.addEventListener('click', exportToJsonFile);
  
  // Add click event listener to "Reset Filter" button (if exists)
  const resetButton = document.getElementById('resetFilter');
  if (resetButton) resetButton.addEventListener('click', resetFilter);
  
  // Add click event listener to "Clear All Data" button (if exists)
  const clearButton = document.getElementById('clearStorage');
  if (clearButton) clearButton.addEventListener('click', clearAllData);
  
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
  
  console.log('DOM manipulation script with filtering and web storage loaded successfully');
  console.log('Initial quotes count:', quotes.length);
  console.log('Filter system initialized');
});

// Mock API URL (JSONPlaceholder)
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from the server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Map server data into { text, category }
    return data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));
  } catch (error) {
    console.error("Error fetching from server:", error);
    return [];
  }
}

// Post a new quote to the server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    const data = await response.json();
    console.log("Posted to server:", data);
  } catch (error) {
    console.error("Error posting to server:", error);
  }
}

// Sync local quotes with server
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  let conflicts = 0;

  // Conflict resolution: server data takes precedence
  serverQuotes.forEach(sq => {
    const matchIndex = localQuotes.findIndex(lq => lq.text === sq.text);
    if (matchIndex !== -1) {
      localQuotes[matchIndex] = sq; // overwrite with server version
      conflicts++;
    } else {
      localQuotes.push(sq); // add missing server quote locally
    }
  });

  // Push local-only quotes to server
  for (let quote of localQuotes) {
    if (quote.category !== "Server") {
      await postQuoteToServer(quote);
    }
  }

  // Save merged result
  localStorage.setItem("quotes", JSON.stringify(localQuotes));
  quotes = localQuotes; // update global quotes array
  populateCategories(); // refresh category filter if needed

  // UI notification
  const statusDiv = document.getElementById("syncStatus");
  if (statusDiv) {
    statusDiv.textContent =
      conflicts > 0
        ? `⚠ Conflict resolved: ${conflicts} quotes replaced by server data`
        : "Quotes synced with server!";
  }
}

// Periodically sync every 15 seconds
setInterval(syncQuotes, 15000);
