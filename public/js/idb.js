// create variable to hold db connection
let db;
//establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// The listener we just added will handle the event of a change that needs to be made to the database's structure. IndexedDB infers that a change needs to be made when the database is first connected (which we're doing now) or if the version number changes.

// add the object store
// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(evt) {
    // save a reference to the database
    const db = evt.target.result;
    // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// With this first event handler, onsuccess, 
// we set it up so that when we finalize the connection to the database, 
// we can store the resulting database object to the global variable db we created earlier. 
// This event will also emit every time we interact with the database, 
// so every time it runs we check to see if the app is connected to the internet network. 
// If so, we'll execute the uploadBudget() function.

// upon a successful
request.onsuccess = function(evt) {
    // when db is sucessfully created with its object store (from onupgradeneeded event above)
    // or simply established a connection, save reference to db in global variable
    db = evt.target.result;

    // check if app is online, if yes run uploadBudget() function to send all local db data to api
    if (navigator.online) {
        uploadBudget();
    }
};

// added the onerror event handler to inform us if anything ever goes wrong with the database interaction.
request.onerror = function(evt) {
    // log error here
    console.log(evt.target.errorCode);
};

// Save Budget Data to IndexedDB
// create structure for storing the data in it. set up the functionality for writing data to it.

// This function will be executed if we attempt to submit a new budget and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store for `new_budget`
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

// Upload the budget Data
// create a function that will handle collecting all of the data from the new_budget object store in IndexedDB and POST it to the server
function uploadBudget() {
    // open a transaction pn your db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successfully .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: 'applicaiton/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(ServerResponse => {
                    if (ServerResponse.message) {
                        throw new Error(ServerResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    // access the new_budget object store
                    const budgetObjectStore = transaction.objectStore('new_budget');
                    // clear all items in your store
                    budgetObjectStore.clear();

                    alert('All saved budget has been submitted')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}


// listen for app coming back online
window.addEventListener('online', uploadBudget);