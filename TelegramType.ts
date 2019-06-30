export interface Chat {
	id: number,
	type: string, // Type of chat, can be either “private”, “group”, “supergroup” or “channel”
	title?: string, // Optional.Title, for supergroups, channels and group chats
	username?: string, // Optional.Username, for private chats, supergroups and channels if available
	first_name?: string, // Optional.First name of the other party in a private chat
	last_name?: string, // Optional.Last name of the other party in a private chat
	all_members_are_administrators?: boolean, // Optional.True if a group has ‘All Members Are Admins’ enabled.
	photo?: ChatPhoto, // Optional.Chat photo.Returned only in getChat.
	description?: string, // Optional.Description, for supergroups and channel chats.Returned only in getChat.
	invite_link?: string, // Optional.Chat invite link, for supergroups and channel chats.Each administrator in a chat generates their own invite links, so the bot must first generate the link using exportChatInviteLink.Returned only in getChat.
	pinned_message?: Message, // Optional.Pinned message, for groups, supergroups and channels.Returned only in getChat.
	sticker_set_name?: string, // Optional.For supergroups, name of group sticker set.Returned only in getChat.
	can_set_sticker_set?: boolean
}

export interface User {
	id: number, //Unique identifier for this user or bot
	is_bot: boolean, //True, if this user is a bot
	first_name: string, //User‘s or bot’s first name
	last_name?: string, //Optional.User‘s or bot’s last name
	username?: string, //Optional.User‘s or bot’s username
	language_code?: string, //Optional.IETF language tag of the user's language
}

export interface Message {
	message_id: number,
	from: User,
	chat: Chat,
	date: number,
	text: string,
	[prop: string]: any
}

export interface ChatPhoto {
	big_file_id: string,
	small_file_id: string
}

export interface Update {
	update_id: number, //The update‘s unique identifier. Update identifiers start from a certain positive number and increase sequentially. This ID becomes especially handy if you’re using Webhooks, since it allows you to ignore repeated updates or to restore the correct update sequence, should they get out of order. If there are no new updates for at least a week, then identifier of the next update will be chosen randomly instead of sequentially.
	message?: Message, // Optional. New incoming message of any kind — text, photo, sticker, etc.
	edited_message?: Message, // Optional. New version of a message that is known to the bot and was edited
	channel_post?: Message, // Optional. New incoming channel post of any kind — text, photo, sticker, etc.
	edited_channel_post?: Message, // Optional. New version of a channel post that is known to the bot and was edited
	[prop: string]: any
	// inline_query	InlineQuery	Optional. New incoming inline query
	// chosen_inline_result	ChosenInlineResult	Optional. The result of an inline query that was chosen by a user and sent to their chat partner. Please see our documentation on the feedback collecting for details on how to enable these updates for your bot.
	// callback_query	CallbackQuery	Optional. New incoming callback query
	// shipping_query	ShippingQuery	Optional. New incoming shipping query. Only for invoices with flexible price
	// pre_checkout_query	PreCheckoutQuery	Optional. New incoming pre-checkout query. Contains full information about checkout
	// poll	Poll	Optional. New poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot
}