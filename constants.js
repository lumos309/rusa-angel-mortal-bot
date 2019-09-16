// constants

const constants = {
	aboutMessage: "About this bot:\n"
				   + "Version: Beta 220819\n"
				   + "Released: 22 Aug '19\n"
				   + "Status: Ready for use!\n"
				   + "Created by @lumos309",
	helpMessage: "Welcome to Rusa Angels & Mortals!\n\n"
				  + "To register for the game, use the /register command.\n\n"
				  + "To message your angel or mortal, use the /angel or /mortal "
				  + "commands.",
    startMessage: "Welcome to Rusa Angels & Mortals!\n\n"
				  + "To register for the game, use the /register command.\n\n"
				  + "To message your angel or mortal, use the /angel or /mortal "
				  + "commands.",
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
	adminId: 385420273
}

Object.entries(constants).forEach(
    ([key, value]) => module.exports[key] = value
	);
