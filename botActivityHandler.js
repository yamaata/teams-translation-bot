const { TeamsActivityHandler, CardFactory } = require('botbuilder');
const { Translate } = require('@google-cloud/translate').v2;


const TRANSLATTION_COLUMN_SET = {
    type: 'ColumnSet',
    columns: [
        {
            type: 'Column',
            width: '80px',
            items: [
                {
                    type: 'TextBlock',
                    text: '',
                    fontType: 'Default',
                    weight: 'Bolder'
                }
            ]
        },
        {
            type: 'Column',
            width: 'stretch',
            items: [
                {
                    type: 'TextBlock',
                    text: '',
                    wrap: true
                }
            ]
        }
    ]
}

class BotActivityHandler extends TeamsActivityHandler {
    constructor() {
        super();
    }
    
    // Invoked when the service receives an incoming action command.
    handleTeamsMessagingExtensionSubmitAction(context, action) {
        switch (action.commandId) {
            case 'createMessage':
                return createMessageCommand(context, action);
            case 'translateMessage':
                return translateMessageCommand(context, action);
            default:
                throw new Error('NotImplemented');
        }
    }
}

// メッセージ投稿時に起動するコマンド
// 入力したメッセージを翻訳し、カードを生成する
async function createMessageCommand(context, action) {
    return await command(action.data.text, action.data)
}

// メッセージ選択時に起動される
// 選択したメッセージを翻訳し、カードを生成する
async function translateMessageCommand(context, action) {
    return await command(action.messagePayload.body.content, action.data)
}

// 翻訳してカードを生成する
async function command(text, params) {
    const translations = {}
    if (params.english == 'true') {
        translations['English'] = await translate(text, 'en')
    }
    if (params.vietnamese == 'true') {
        translations['Vietnamese'] = await translate(text, 'vi')
    }
    if (params.filipino == 'true') {
        translations['Filipino'] = await translate(text, 'tl')
    }
    
    const card = {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: '現場責任者からのメッセージ'
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.3'
    }
    const japaneseColumnSet = JSON.parse(JSON.stringify(TRANSLATTION_COLUMN_SET)) // ディープコピーするためにJSON変換を利用する
    japaneseColumnSet.columns[0].items[0].text = 'Japanese'
    japaneseColumnSet.columns[1].items[0].text = text
    card.body.push(japaneseColumnSet)

    addTranslation(card, translations)
    const adaptiveCard = CardFactory.adaptiveCard(card)

    const attachment = { contentType: adaptiveCard.contentType, content: adaptiveCard.content, preview: adaptiveCard };

    return {
        composeExtension: {
            type: 'result',
            attachmentLayout: 'list',
            attachments: [
                attachment
            ]
        }
    };
}

// カードに翻訳情報を追加する
function addTranslation(card, translations) {
    Object.keys(translations).forEach(language => {
        const columnSet = JSON.parse(JSON.stringify(TRANSLATTION_COLUMN_SET))
        columnSet.columns[0].items[0].text = language
        columnSet.columns[1].items[0].text = translations[language]
        card.body.push(columnSet)
    })
}

// 翻訳する
async function translate(message, target = 'en') {
    const translate = new Translate();
    let [translatedMessage] = await translate.translate(message, target);
    
    return translatedMessage;
}

module.exports.BotActivityHandler = BotActivityHandler;
