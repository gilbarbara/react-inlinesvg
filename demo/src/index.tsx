import * as React from 'react';
import { createRoot } from 'react-dom/client';
import SVG from 'react-inlinesvg';

import { Grid, GridItem, SubTitle, Title, Wrapper } from './components';
import GitHubRepo from './GitHubRepo';
import { base64, markup, urlEncoded } from './strings';

const { env } = process;

env.PUBLIC_URL = env.PUBLIC_URL || '';

function App() {
  const ref = React.useRef<SVGElement>(null);

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
            <SVG src={`${process.env.PUBLIC_URL}/vue.svg`} />
          </div>
        </GridItem>

        <GridItem>
          <h4>Fallback</h4>
          <div>
            {/* This file doesn't exist */}
            <SVG loader="Loading..." src="https://cdn.svgporn.com/logos/react-rules.svg">
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
      <SVG innerRef={ref} src={`${process.env.PUBLIC_URL}/icons.svg`} />
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

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  root.render(<App />);
}
