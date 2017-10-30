global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

global.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
});

global.setURL = url => {
  const parser = document.createElement('a');
  parser.href = url;
  ['href', 'protocol', 'host', 'hostname', 'origin', 'port', 'pathname', 'search', 'hash'].forEach(prop => {
    Object.defineProperty(window.location, prop, {
      value: parser[prop],
      writable: true,
    });
  });
};
