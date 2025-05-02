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
            width: 240px;
            height: 140px;
            padding: 25px 30px;
            border-radius: 10px;
        }

        .buttons-container {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            margin-top: 20px;

            button {
                padding: 5px 10px;
                border-radius: 5px;
                border: none;
                background-color: #f0f0f0;
                cursor: pointer;
            }

            button#approve-install-btn {
                background-color: #8b6ddf;
                color: white;
            }
        }

    }`

