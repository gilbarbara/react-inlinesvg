import * as React from 'react';
import { render } from 'react-dom';
import SVG from 'react-inlinesvg';
import { base64, urlEncoded, markup } from './media/strings';

import { Grid, GridItem, SubTitle, Title, Wrapper } from './components';
import GitHubRepo from './GitHubRepo';

import vue from './media/vue.svgz';
import icons from './media/icons.svgz';

// Using extension .svgz to avoid svgr loader in webpack

function App() {
  const ref = React.useRef();

  return (
    <Wrapper>
      <GitHubRepo />
      <Title>react-inlinesvg</Title>
      <p>An SVG loader component for ReactJS</p>
      <Grid size={3}>
        <GridItem>
          <h4>Remote URL</h4>
          <div>
            <SVG src="https://cdn.svgporn.com/logos/firefox.svg" />
          </div>
        </GridItem>
        <GridItem>
          <h4>Local File</h4>
          <div>
            <SVG src={vue} />
          </div>
        </GridItem>

        <GridItem>
          <h4>Fallback</h4>
          <div>
            {/* This file doesn't exist */}
            <SVG src="https://cdn.svgporn.com/logos/react-rules.svg" loader="Loading...">
              <SVG src="https://cdn.svgporn.com/logos/angular-icon.svg" />
            </SVG>
          </div>
        </GridItem>
      </Grid>
      <SubTitle>From string</SubTitle>
      <Grid size={3}>
        <GridItem>
          <h4>Base 64</h4>
          <div>
            <SVG src={base64} />
          </div>
        </GridItem>
        <GridItem>
          <h4>URL Encoded</h4>
          <div>
            <SVG src={urlEncoded} />
          </div>
        </GridItem>
        <GridItem>
          <h4>Markup</h4>
          <div>
            <SVG src={markup} />
          </div>
        </GridItem>
      </Grid>
      <SVG ref={ref} src={icons} />
      <SubTitle>With symbols</SubTitle>
      <Grid>
        <GridItem>
          <h4>Symbol: Sun</h4>
          <div>
            <svg>
              <use xlinkHref="#sun" />
            </svg>
          </div>
        </GridItem>
        <GridItem>
          <h4>Symbol: Cloud</h4>
          <div>
            <svg>
              <use xlinkHref="#cloud" />
            </svg>
          </div>
        </GridItem>
        <GridItem>
          <h4>Symbol: Rain</h4>
          <div>
            <svg>
              <use xlinkHref="#rain" />
            </svg>
          </div>
        </GridItem>
      </Grid>
    </Wrapper>
  );
}

const rootElement = document.getElementById('root');
render(<App />, rootElement);
