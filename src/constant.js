import React from 'react';
let BACKENDURL = '';

if (React.isDevelopment) {
    BACKENDURL = 'https://stockboard.zapto.org';
    // Development thing
} else {
    // Real thing
    BACKENDURL = 'https://stockboard.zapto.org';
}

export default BACKENDURL;