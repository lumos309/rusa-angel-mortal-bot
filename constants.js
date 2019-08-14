// constants

const constants = {
	aboutMessage: "About this bot:\n"
				   + "Version: Beta 140819\n"
				   + "Released: 14 Aug '19\n"
				   + "Status: First version!\n"
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
	creditsURL: 'https://aces.nus.edu.sg/Prjhml',
	menuURL: 'http://hg.sg/nus_ohs_admin/adminOHS/backend/script/index.php?controller=pjFront&action=pjActionLoadEventDetail&index=4455&cate=0&dt=',
}

Object.entries(constants).forEach(
    ([key, value]) => module.exports[key] = value
	);
