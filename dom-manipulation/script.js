// Server sync state
let autoSyncEnabled = true;
let syncInterval = null;
let isOnline = navigator.onLine;
let serverQuotes = [];
let conflictData = null;
let lastSyncTimestamp = null;

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

// Server Simulation and Sync Functions
const SERVER_API = 'https://jsonplaceholder.typicode.com/posts';

function showNotification(message, type = 'success') {
  // Simple console notification for basic version
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // If notification elements exist, use them
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.color = 'white';
  notification.style.zIndex = '1000';
  notification.textContent = message;
  
  switch(type) {
    case 'success':
      notification.style.backgroundColor = '#28a745';
      break;
    case 'error':
      notification.style.backgroundColor = '#dc3545';
      break;
    case 'warning':
      notification.style.backgroundColor = '#ffc107';
      notification.style.color = '#212529';
      break;
  }
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);
}

function updateSyncStatus(status, message) {
  // Update sync indicators if they exist
  const syncStatus = document.getElementById('syncStatus');
  const serverStatus = document.getElementById('serverStatus');
  
  if (syncStatus) {
    syncStatus.className = `sync-indicator ${status}`;
    
    switch(status) {
      case 'online':
        syncStatus.textContent = '🟢 Connected';
        break;
      case 'syncing':
        syncStatus.textContent = '🟡 Syncing...';
        break;
      case 'offline':
        syncStatus.textContent = '🔴 Offline';
        break;
      case 'conflict':
        syncStatus.textContent = '🟠 Conflict Detected';
        const resolveBtn = document.getElementById('resolveConflicts');
        if (resolveBtn) resolveBtn.classList.remove('hidden');
        break;
    }
  }
  
  if (serverStatus) {
    switch(status) {
      case 'online':
        serverStatus.textContent = 'Online';
        serverStatus.style.color = '#28a745';
        break;
      case 'syncing':
        serverStatus.textContent = 'Syncing';
        serverStatus.style.color = '#ffc107';
        break;
      case 'offline':
        serverStatus.textContent = 'Offline';
        serverStatus.style.color = '#dc3545';
        break;
      case 'conflict':
        serverStatus.textContent = 'Conflict';
        serverStatus.style.color = '#fd7e14';
        break;
    }
  }
  
  if (message) {
    showNotification(message, status === 'offline' ? 'error' : status === 'conflict' ? 'warning' : 'success');
  }
}

async function fetchFromServer() {
  try {
    updateSyncStatus('syncing');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(SERVER_API + '?_limit=10');
    if (!response.ok) throw new Error('Server request failed');
    
    const serverPosts = await response.json();
    
    // Transform JSONPlaceholder posts into quote format
    serverQuotes = serverPosts.map((post, index) => ({
      text: post.body.split('.')[0] + '.',
      category: ['motivation', 'life', 'success', 'inspiration', 'wisdom'][index % 5],
      serverId: post.id,
      lastModified: new Date().toISOString()
    }));
    
    updateSyncStatus('online', 'Server data fetched successfully');
    return serverQuotes;
    
  } catch (error) {
    console.error('Server fetch error:', error);
    updateSyncStatus('offline', 'Failed to connect to server');
    return null;
  }
}

async function postToServer(quotesToSync) {
  try {
    updateSyncStatus('syncing');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const response = await fetch(SERVER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Quotes Sync',
        body: JSON.stringify(quotesToSync),
        userId: 1
      })
    });
    
    if (!response.ok) throw new Error('Server post failed');
    
    const result = await response.json();
    updateSyncStatus('online', 'Local data synced to server');
    return result;
    
  } catch (error) {
    console.error('Server post error:', error);
    updateSyncStatus('offline', 'Failed to sync to server');
    return null;
  }
}

function detectConflicts(localQuotes, serverQuotes) {
  const conflicts = [];
  const localMap = new Map(localQuotes.map(q => [q.text.toLowerCase(), q]));
  
  serverQuotes.forEach(serverQuote => {
    const localQuote = localMap.get(serverQuote.text.toLowerCase());
    if (localQuote && localQuote.category !== serverQuote.category) {
      conflicts.push({
        type: 'category_mismatch',
        local: localQuote,
        server: serverQuote
      });
    }
  });
  
  return conflicts;
}

async function syncWithServer() {
  if (!isOnline) {
    updateSyncStatus('offline', 'Device is offline');
    return;
  }
  
  try {
    const fetchedQuotes = await fetchFromServer();
    if (!fetchedQuotes) return;
    
    const conflicts = detectConflicts(quotes, fetchedQuotes);
    
    if (conflicts.length > 0) {
      conflictData = {
        conflicts: conflicts,
        serverQuotes: fetchedQuotes
      };
      updateSyncStatus('conflict', `${conflicts.length} conflicts detected`);
      showConflictNotification(conflicts.length);
      return;
    }
    
    const mergedQuotes = mergeServerData(quotes, fetchedQuotes);
    if (mergedQuotes.length !== quotes.length) {
      quotes = mergedQuotes;
      filteredQuotes = [...quotes];
      saveQuotes();
      populateCategories();
      filterQuotes();
      updateSyncStatus('online', `Synced: Added ${mergedQuotes.length - quotes.length + fetchedQuotes.length} new quotes`);
    } else {
      updateSyncStatus('online', 'Data is up to date');
    }
    
    updateLastSyncTime();
    
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('offline', 'Sync failed');
  }
}

function mergeServerData(localQuotes, serverQuotes) {
  const merged = [...localQuotes];
  const localTexts = new Set(localQuotes.map(q => q.text.toLowerCase()));
  
  serverQuotes.forEach(serverQuote => {
    if (!localTexts.has(serverQuote.text.toLowerCase())) {
      merged.push({
        text: serverQuote.text,
        category: serverQuote.category,
        source: 'server',
        synced: true
      });
    }
  });
  
  return merged;
}

function showConflictNotification(conflictCount) {
  const notification = document.getElementById('conflictNotification');
  if (notification) {
    const message = document.getElementById('conflictMessage');
    message.textContent = `Found ${conflictCount} conflicts between local and server data. Choose how to resolve:`;
    notification.classList.remove('hidden');
  } else {
    // Fallback for basic version
    const choice = confirm(`Found ${conflictCount} conflicts. Click OK to use server data, Cancel to keep local data.`);
    if (choice) {
      useServerData();
    } else {
      useLocalData();
    }
  }
}

function hideConflictNotification() {
  const notification = document.getElementById('conflictNotification');
  const resolveBtn = document.getElementById('resolveConflicts');
  if (notification) notification.classList.add('hidden');
  if (resolveBtn) resolveBtn.classList.add('hidden');
  conflictData = null;
}

function useServerData() {
  if (!conflictData) return;
  
  quotes = mergeServerData([], conflictData.serverQuotes);
  filteredQuotes = [...quotes];
  saveQuotes();
  populateCategories();
  filterQuotes();
  
  hideConflictNotification();
  updateSyncStatus('online', 'Conflicts resolved: Using server data');
  updateLastSyncTime();
}

function useLocalData() {
  if (!conflictData) return;
  
  postToServer(quotes);
  hideConflictNotification();
  updateSyncStatus('online', 'Conflicts resolved: Keeping local data');
  updateLastSyncTime();
}

function mergeData() {
  if (!conflictData) return;
  
  const mergedQuotes = mergeServerData(quotes, conflictData.serverQuotes);
  
  conflictData.conflicts.forEach(conflict => {
    if (conflict.type === 'category_mismatch') {
      mergedQuotes.push({
        text: conflict.server.text + ' (server version)',
        category: conflict.server.category,
        source: 'server'
      });
    }
  });
  
  quotes = mergedQuotes;
  filteredQuotes = [...quotes];
  saveQuotes();
  populateCategories();
  filterQuotes();
  
  hideConflictNotification();
  updateSyncStatus('online', 'Conflicts resolved: Data merged');
  updateLastSyncTime();
}

function toggleAutoSync() {
  autoSyncEnabled = !autoSyncEnabled;
  const button = document.getElementById('toggleAutoSync');
  const status = document.getElementById('autoSyncStatus');
  
  if (button) {
    if (autoSyncEnabled) {
      button.textContent = '⚙️ Auto Sync: ON';
      button.classList.remove('disabled');
      startAutoSync();
      showNotification('Auto sync enabled', 'success');
    } else {
      button.textContent = '⚙️ Auto Sync: OFF';
      button.classList.add('disabled');
      stopAutoSync();
      showNotification('Auto sync disabled', 'warning');
    }
  }
  
  if (status) {
    status.textContent = autoSyncEnabled ? 'Enabled' : 'Disabled';
  }
  
  saveToSessionStorage('autoSyncEnabled', autoSyncEnabled);
}

function startAutoSync() {
  if (syncInterval) clearInterval(syncInterval);
  
  syncInterval = setInterval(() => {
    if (autoSyncEnabled && isOnline) {
      syncWithServer();
    }
  }, 30000);
}

function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function handleOnlineStatus() {
  isOnline = navigator.onLine;
  if (isOnline) {
    updateSyncStatus('online', 'Connection restored');
    if (autoSyncEnabled) syncWithServer();
  } else {
    updateSyncStatus('offline', 'Connection lost');
  }
}

function updateLastSyncTime() {
  const now = new Date();
  lastSyncTimestamp = now.toISOString();
  const lastSyncElement = document.getElementById('lastSync');
  if (lastSyncElement) {
    lastSyncElement.textContent = `Last sync: ${now.toLocaleTimeString()}`;
  }
  saveToSessionStorage('lastSyncTime', lastSyncTimestamp);
}

function loadLastSyncTime() {
  const stored = getFromSessionStorage('lastSyncTime');
  if (stored) {
    lastSyncTimestamp = stored;
    const date = new Date(stored);
    const lastSyncElement = document.getElementById('lastSync');
    if (lastSyncElement) {
      lastSyncElement.textContent = `Last sync: ${date.toLocaleTimeString()}`;
    }
  }
}

// Local Storage Functions
function saveQuotes() {
  try {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    updateStorageInfo();
    console.log('Quotes saved to localStorage');
    
    // Trigger sync if online and auto-sync is enabled
    if (isOnline && autoSyncEnabled && quotes.length > 0) {
      setTimeout(() => postToServer(quotes), 2000);
    }
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
    
    // Load sync preferences
    const autoSyncPref = getFromSessionStorage('autoSyncEnabled');
    if (autoSyncPref !== null) {
      autoSyncEnabled = autoSyncPref;
      const button = document.getElementById('toggleAutoSync');
      const status = document.getElementById('autoSyncStatus');
      if (button && !autoSyncEnabled) {
        button.textContent = '⚙️ Auto Sync: OFF';
        button.classList.add('disabled');
      }
      if (status) {
        status.textContent = autoSyncEnabled ? 'Enabled' : 'Disabled';
      }
    }
    
    // Initial sync if online and auto-sync enabled
    if (isOnline && autoSyncEnabled) {
      setTimeout(syncWithServer, 2000);
    }
    
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
  
  // Add click event listeners for sync controls (if they exist)
  const manualSyncBtn = document.getElementById('manualSync');
  const toggleAutoSyncBtn = document.getElementById('toggleAutoSync');
  const useServerBtn = document.getElementById('useServerData');
  const useLocalBtn = document.getElementById('useLocalData');
  const mergeBtn = document.getElementById('mergeData');
  const resolveBtn = document.getElementById('resolveConflicts');
  
  if (manualSyncBtn) manualSyncBtn.addEventListener('click', syncWithServer);
  if (toggleAutoSyncBtn) toggleAutoSyncBtn.addEventListener('click', toggleAutoSync);
  if (useServerBtn) useServerBtn.addEventListener('click', useServerData);
  if (useLocalBtn) useLocalBtn.addEventListener('click', useLocalData);
  if (mergeBtn) mergeBtn.addEventListener('click', mergeData);
  if (resolveBtn) {
    resolveBtn.addEventListener('click', () => {
      const notification = document.getElementById('conflictNotification');
      if (notification) notification.classList.remove('hidden');
    });
  }
  
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
  
  // Handle online/offline events
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  
  // Load last sync time
  loadLastSyncTime();
  
  // Start auto sync if enabled
  if (autoSyncEnabled) {
    startAutoSync();
  }
  
  // Initial connection check
  handleOnlineStatus();
  
  // Handle page unload to save session data
  window.addEventListener('beforeunload', function() {
    // Save any pending session data
    saveToSessionStorage('sessionEnded', new Date().toISOString());
    
    // Stop sync interval
    stopAutoSync();
  });
  
  console.log('Enterprise Quote Generator with Server Sync loaded successfully');
  console.log('Initial quotes count:', quotes.length);
  console.log('Filter system initialized');
  console.log('Sync system initialized - Auto sync:', autoSyncEnabled);
});