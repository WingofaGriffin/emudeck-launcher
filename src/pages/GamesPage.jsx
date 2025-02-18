import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useContext,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import { GlobalContext } from 'context/globalContext';
import ProgressBar from 'components/atoms/ProgressBar/ProgressBar';
import { useFocusable, init, FocusContext } from '../spatial';

init({
  debug: true,
  visualDebug: false,
});

function Game({ data, onEnterPress, onFocus }) {
  const { ref, focused } = useFocusable({
    onEnterPress,
    onFocus,
  });

  const item = data;
  let { name } = item;
  const maxLength = 24;
  const ogName = name;
  name = name.slice(0, maxLength);
  const isTextCut = ogName.length > maxLength;
  return (
    <Link
      ref={ref}
      focused={focused}
      className={`games__system ${focused ? 'games__system--focused' : ''}`}
    >
      {!item.logo && (
        <div className="games__name">
          {name}
          {isTextCut && '...'}
        </div>
      )}
      {item.box && (
        <img
          loading="lazy"
          className="games__bg"
          src={`https://images.launchbox-app.com/${item.box}`}
          alt=""
        />
      )}
      {item.screenshot && (
        <img
          loading="lazy"
          className="games__bg games__screenshot"
          src={`https://images.launchbox-app.com/${item.screenshot}`}
          alt=""
        />
      )}
      {item.logo && (
        <img
          loading="lazy"
          className="games__bg games__logo"
          src={`https://images.launchbox-app.com/${item.logo}`}
          alt=""
        />
      )}
    </Link>
  );
}

function GamesPage({ focusKey: focusKeyParam }) {
  const ipcChannel = window.electron.ipcRenderer;
  const [statePage, setStatePage] = useState({ games: null });
  const { games } = statePage;
  const { system } = useParams();

  useEffect(() => {
    const cache = localStorage.getItem(system);
    if (cache) {
      console.log('restore from cache');
      const json = JSON.parse(cache);
      const gamesArray = Object.values(json);
      setStatePage({ ...statePage, games: gamesArray });
      console.log('Cache restored');
    } else {
      console.log('ask for games');
      ipcChannel.sendMessage(`get-games`, system);
      ipcChannel.once('get-games', (gamesTemp) => {
        console.log('games received');
        const json = JSON.parse(gamesTemp);
        const gamesArray = Object.values(json);

        localStorage.setItem(system, gamesTemp);
        console.log('games to state');
        setStatePage({ ...statePage, games: gamesArray });
        console.log('games loaded');
      });
    }
  }, []);

  const scrollingRef = useRef(null);

  const onAssetFocus = useCallback(
    ({ x, y }) => {
      scrollingRef.current.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth',
      });
    },
    [scrollingRef],
  );

  const { ref, focusSelf, hasFocusedChild, focusKey } = useFocusable({
    focusable: true,
    saveLastFocusedChild: false,
    trackChildren: true,
    autoRestoreFocus: true,
    isFocusBoundary: false,
    focusKey: focusKeyParam,
    preferredChildFocusKey: null,
    onEnterPress: () => {},
    onEnterRelease: () => {},
    onArrowPress: () => true,
    onFocus: () => {},
    onBlur: () => {},
    extraProps: { foo: 'bar' },
  });

  useEffect(() => {
    focusSelf();
  }, [games]);

  const loadGame = (item) => {
    ipcChannel.sendMessage('load-game', [item]);
    ipcChannel.once('load-game', (error, stdout, stderr) => {
      console.log({ error, stdout, stderr });
    });
  };

  return (
    <>
      {!games && (
        <div className="center">
          <div className="center__group">
            <span className="h3">Creating database, please wait...</span>
            <br />
            <ProgressBar css="progress--success" infinite max="100" />
          </div>
        </div>
      )}
      {games && (
        <div className="system-title">
          <img
            src={`file:///home/deck/emudeck/launcher/themes/enabled/logos/${system}.svg`}
            alt="alt"
            width="200"
          />
        </div>
      )}
      <FocusContext.Provider value={focusKey}>
        {games && (
          <ul className="controls">
            <li>
              <span>A</span> Play
            </li>
            <li>
              <span>X</span> Refresh
            </li>
          </ul>
        )}
        {games && (
          <div ref={ref} className={system}>
            <div
              ref={scrollingRef}
              className={`games ${
                hasFocusedChild ? 'games-focused' : 'games-unfocused'
              }`}
            >
              {games &&
                games.map((item, i) => {
                  return (
                    <Game
                      data={item}
                      key={i}
                      onFocus={onAssetFocus}
                      onEnterPress={() => loadGame(item)}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </FocusContext.Provider>
    </>
  );
}

export default GamesPage;
