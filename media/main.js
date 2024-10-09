(function () {
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent

    change(message.animation, message.breed);
  });

  const hypedawg = document.getElementById("hypedawg");
  let currentBreed = "golden";
  let currentTimeout = null;
  function change(animation, breed) {
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    if (breed) {
      currentBreed = breed;
    }
    hypedawg.className = `${animation} ${currentBreed}`;

    currentTimeout = setTimeout(function () {
      hypedawg.className = `idle ${currentBreed}`;
    }, 20000);
  }
})();
