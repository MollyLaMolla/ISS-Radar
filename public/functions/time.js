setInterval(() => {
    const time = Math.floor(Date.now() / 1000); // Tempo in secondi
    const userTimeZoneOffset = new Date().getTimezoneOffset() * 60; // Offset in seconds
    const userTime = time - userTimeZoneOffset; // Adjust time to user's timezone
    const userHours = Math.floor(userTime / 3600) % 24; // Ore
    const userMinutes = Math.floor((userTime % 3600) / 60); // Minuti
    const userSeconds = userTime % 60; // Secondi
    const formattedUserTime = `${String(userHours).padStart(2, "0")}:${String(userMinutes).padStart(2, "0")}:${String(userSeconds).padStart(2, "0")}`;
    $("#info-time").text(formattedUserTime);
}, 300); // Aggiorna ogni secondo