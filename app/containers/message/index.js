import React from 'react';
import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import { KeyboardUtils } from 'react-native-keyboard-input';

import Message from './Message';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES } from './utils';
import messagesStatus from '../../constants/messagesStatus';

export default class MessageContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		customTimeFormat: PropTypes.string,
		customThreadTimeFormat: PropTypes.string,
		style: ViewPropTypes.style,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		previousItem: PropTypes.object,
		_updatedAt: PropTypes.instanceOf(Date),
		baseUrl: PropTypes.string,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		useRealName: PropTypes.bool,
		status: PropTypes.number,
		navigation: PropTypes.object,
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		errorActionsShow: PropTypes.func,
		replyBroadcast: PropTypes.func,
		toggleReactionPicker: PropTypes.func,
		fetchThreadName: PropTypes.func,
		onOpenFileModal: PropTypes.func
	}

	static defaultProps = {
		onLongPress: () => {},
		_updatedAt: new Date(),
		archived: false,
		broadcast: false
	}

	shouldComponentUpdate(nextProps) {
		const {
			status, item, _updatedAt
		} = this.props;

		if (status !== nextProps.status) {
			return true;
		}
		if (item.tmsg !== nextProps.item.tmsg) {
			return true;
		}

		return _updatedAt.toISOString() !== nextProps._updatedAt.toISOString();
	}

	onPress = debounce(() => {
		const { item } = this.props;
		KeyboardUtils.dismiss();

		if ((item.tlm || item.tmid)) {
			this.onThreadPress();
		}
	}, 300, true);

	onLongPress = () => {
		const { archived, onLongPress } = this.props;
		if (this.isInfo || this.hasError || archived) {
			return;
		}
		onLongPress(this.parseMessage());
	}

	onErrorPress = () => {
		const { errorActionsShow } = this.props;
		errorActionsShow(this.parseMessage());
	}

	onReactionPress = (emoji) => {
		const { onReactionPress, item } = this.props;
		onReactionPress(emoji, item._id);
	}

	onDiscussionPress = () => {
		const { onDiscussionPress, item } = this.props;
		onDiscussionPress(item);
	}

	onThreadPress = debounce(() => {
		const { navigation, item } = this.props;
		if (item.tmid) {
			navigation.push('RoomView', {
				rid: item.rid, tmid: item.tmid, name: item.tmsg, t: 'thread'
			});
		} else if (item.tlm) {
			const title = item.msg || (item.attachments && item.attachments.length && item.attachments[0].title);
			navigation.push('RoomView', {
				rid: item.rid, tmid: item._id, name: title, t: 'thread'
			});
		}
	}, 1000, true)

	get timeFormat() {
		const { customTimeFormat, Message_TimeFormat } = this.props;
		return customTimeFormat || Message_TimeFormat;
	}

	// closeReactions = () => {
	// 	this.setState({ reactionsModal: false });
	// }

	get isHeader() {
		const {
			item, previousItem, broadcast, Message_GroupingPeriod
		} = this.props;
		if (previousItem && (
			(previousItem.ts.toDateString() === item.ts.toDateString())
			&& (previousItem.u.username === item.u.username)
			&& !(previousItem.groupable === false || item.groupable === false || broadcast === true)
			&& (item.ts - previousItem.ts < Message_GroupingPeriod * 1000)
			&& (previousItem.tmid === item.tmid)
		)) {
			return false;
		}
		return true;
	}

	get isThreadReply() {
		const {
			item, previousItem
		} = this.props;
		if (previousItem && item.tmid && (previousItem.tmid !== item.tmid) && (previousItem._id !== item.tmid)) {
			return true;
		}
		return false;
	}

	get isThreadSequential() {
		const {
			item, previousItem
		} = this.props;
		if (previousItem && item.tmid && ((previousItem.tmid === item.tmid) || (previousItem._id === item.tmid))) {
			return true;
		}
		return false;
	}

	get isInfo() {
		const { item } = this.props;
		return SYSTEM_MESSAGES.includes(item.t);
	}

	get isTemp() {
		const { item } = this.props;
		return item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR;
	}

	get hasError() {
		const { item } = this.props;
		return item.status === messagesStatus.ERROR;
	}

	parseMessage = () => {
		const { item } = this.props;
		return JSON.parse(JSON.stringify(item));
	}

	toggleReactionPicker = () => {
		const { toggleReactionPicker } = this.props;
		toggleReactionPicker(this.parseMessage());
	}

	replyBroadcast = () => {
		const { replyBroadcast } = this.props;
		replyBroadcast(this.parseMessage());
	}

	render() {
		// console.log(`RENDERING ${ this.props.item._id }`)
		const {
			item, user, style, archived, baseUrl, useRealName, broadcast, fetchThreadName, customThreadTimeFormat, onOpenFileModal
		} = this.props;
		const {
			_id, msg, ts, attachments, urls, reactions, t, status, avatar, u, alias, editedBy, role, drid, dcount, dlm, tmid, tcount, tlm, tmsg
		} = item;
		return (
			<Message
				id={_id}
				msg={msg}
				author={u}
				ts={ts}
				type={t}
				status={status}
				attachments={attachments}
				urls={urls}
				reactions={reactions}
				alias={alias}
				avatar={avatar}
				user={user}
				timeFormat={this.timeFormat}
				customThreadTimeFormat={customThreadTimeFormat}
				style={style}
				archived={archived}
				broadcast={broadcast}
				baseUrl={baseUrl}
				// reactionsModal={reactionsModal}
				useRealName={useRealName}
				role={role}
				drid={drid}
				dcount={dcount}
				dlm={dlm}
				tmid={tmid}
				tcount={tcount}
				tlm={tlm}
				tmsg={tmsg}
				fetchThreadName={fetchThreadName}
				isEdited={editedBy && !!editedBy.username}
				isHeader={this.isHeader}
				isThreadReply={this.isThreadReply}
				isThreadSequential={this.isThreadSequential}
				isInfo={this.isInfo}
				isTemp={this.isTemp}
				hasError={this.hasError}
				// closeReactions={this.closeReactions}
				onErrorPress={this.onErrorPress}
				onPress={this.onPress}
				onLongPress={this.onLongPress}
				// onReactionLongPress={this.onReactionLongPress}
				onReactionPress={this.onReactionPress}
				replyBroadcast={this.replyBroadcast}
				toggleReactionPicker={this.toggleReactionPicker}
				onDiscussionPress={this.onDiscussionPress}
				onOpenFileModal={onOpenFileModal}
			/>
		);
	}
}
