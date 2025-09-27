// Debug script to check catalog data
// Run this in your browser console on the catalog page

// Check if we can fetch the data directly
fetch('/api/debug-catalog', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => {
  console.log('Catalog debug data:', data);
})
.catch(err => {
  console.error('Error:', err);
});

// Or check what the page is actually querying
console.log('Check Network tab for any failed requests to hunt_models table');