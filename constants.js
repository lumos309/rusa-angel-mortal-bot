// constants

const constants = {
	aboutMessage: "About this bot:\n"
		+ "Version: 2.1\n"
		+ "Released: 11 Aug '20\n"
		+ "Status: Updated to work by zone; added /unregister command\n"
		+ "Created by @lumos309",
	helpMessage: "Welcome to RVRC Angels & Mortals 2020!\n\n"
		+ "To join the game, use the /register command.\n\n"
		+ "To send messages, write '/angel' or '/mortal' followed by your message.\n\n"
		+ "For example:\n"
		+ "/angel Hi angel! Thanks for the gifts :)\n"
		+ "/mortal Hey mortal. You're welcome!",
  startMessage: "Welcome to RVRC Angels & Mortals 2020!\n\n"
		+ "To join the game, use the /register command.\n\n"
		+ "To send messages, write '/angel' or '/mortal' followed by your message.\n\n"
		+ "For example:\n"
		+ "/angel Hi angel! Thanks for the gifts :)\n"
		+ "/mortal Hey mortal. You're welcome!",
	verifyAdminMessage: "Please send the admin password and the zone for which you want to start the game"
		+ "(e.g. <password> A)",
	assignZoneMessage: "Which zone do you want to start the game (A, B, or C)?\n\n"
		+ "(For security reasons, you should delete your previous message with the password.)",
	pairingNotFoundMessage: "Your angel or mortal could not be found. "
		+ "The game may not have started yet, or the server may be down.",
	messageSentMessage: "✔️📤 Message sent!",
	yesNoKeyboard: {
		keyboard: [["Yes", "No"]],
		one_time_keyboard: true,
		resize_keyboard: true,
		},
	genderSelectKeyboard: {
		keyboard: [["Male", "Female", "Other / Prefer not to say"]],
		one_time_keyboard: true,
		resize_keyboard: true,
		},
	zoneSelectKeyboard: {
		keyboard: [["A", "B", "C"]],
		one_time_keyboard: true,
		resize_keyboard: true,
		},
	adminId: 385420273,
}

Object.entries(constants).forEach(
    ([key, value]) => module.exports[key] = value
	);
