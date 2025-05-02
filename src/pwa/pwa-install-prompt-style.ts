export const pwaInstallPromptStyle = `  .install-app-prompt {
        position: absolute;  
        background-color: rgba(0, 0, 0, 0.2);
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;

        .inner-prompt {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: white;
            width: 280px;
            max-width: 90vw;
            height: auto;
            min-height: 140px;
            max-height: 90vh;
            padding: 25px 30px;
            border-radius: 10px;
            overflow: hidden;
            box-sizing: border-box;
        }

        .app-icon {
            max-width: 64px;
            max-height: 64px;
            align-self: center;
            margin-bottom: 10px;
        }

        span {
            text-align: center;
            margin: 10px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .buttons-container {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            margin-top: 20px;
            flex-wrap: wrap;
            gap: 10px;

            button {
                padding: 8px 12px;
                border-radius: 5px;
                border: none;
                background-color: #f0f0f0;
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 120px;
                min-width: 80px;
            }

            button#approve-install-btn {
                background-color: #8b6ddf;
                color: white;
            }
        }

    }`

