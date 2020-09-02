// constants

const constants = {
	aboutMessage: "About this bot:\n"
		+ "Version: 2.3.1\n"
		+ "Released: 02 Sep '20\n"
		+ "Patch Notes: Add admin feature: list pairings\n"
		+ "Created by @lumos309",
	helpMessage: "Welcome to RVRC Angels & Mortals 2020!\n\n"
		+ "To join the game, use the /register command.\n\n"
		+ "To send messages, write '/a' or '/m' followed by your message.\n\n"
		+ "For example:\n"
		+ "/a Hi angel! Thanks for the gifts :)\n"
		+ "/m Hey mortal. You're welcome!\n\n"
		+ "For tech support, PM @lumos309 wtih screenshots of any errors.",
  startMessage: "Welcome to RVRC Angels & Mortals 2020!\n\n"
		+ "To join the game, use the /register command.\n\n"
		+ "To send messages, write '/a' or '/m' followed by your message.\n\n"
		+ "For example:\n"
		+ "/a Hi angel! Thanks for the gifts :)\n"
		+ "/m Hey mortal. You're welcome!",
	verifyAdminMessage: "Please send the admin password and the zone for which you want to start the game"
		+ "(e.g. <password> A)",
	assignZoneMessage: "Which zone do you want to start the game (A, B, or C)?\n\n"
		+ "(For security reasons, you should delete your previous message with the password.)",
	pairingNotFoundMessage: "Your angel or mortal could not be found. "
		+ "The game may not have started yet, or the server may be down.",
	messageSentMessage: "✔️📤 Message sent!",
	accessMortalSuccessMessage: "Mortal retrieved successfully! Sending them your message... 📤\n\n"
		+ '❗️*NOTE*: To reduce clutter, we will not send any more "Message sent" acknowledgements '
		+ "upon successful delivery. You will only receive an error message if the sending failed.",
	accessAngelSuccessMessage: "Angel retrieved successfully! Sending them your message... 📤\n\n"
		+ '❗️*NOTE*: To reduce clutter, we will not send any more "Message sent" acknowledgements '
		+ "upon successful delivery. You will only receive an error message if the sending failed.",
	adminPairingsRetrievedMessage: "Done!\n\nEach user is the angel of the user below; "
		+ "the last user is the first user's angel.",
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
