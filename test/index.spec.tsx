import * as React from 'react';
import { act, render, waitFor as waitForBase } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import ReactInlineSVG, { cacheStore, Props } from '../src/index';

jest.useFakeTimers();

const fixtures = {
  circles: 'http://127.0.0.1:1337/circles.svg',
  dots: 'http://127.0.0.1:1337/dots.svg',
  icons: 'http://127.0.0.1:1337/icons.svg',
  play: 'http://127.0.0.1:1337/play.svg',
  react: 'http://127.0.0.1:1337/react.svg',
  react_png: 'http://127.0.0.1:1337/react.png',
  tiger: 'http://127.0.0.1:1337/tiger.svg',
  datahref: 'http://127.0.0.1:1337/datahref.svg',
  styles: 'http://127.0.0.1:1337/styles.svg',
  utf8: 'http://127.0.0.1:1337/utf8.svg',
  url: 'https://cdn.svgporn.com/logos/react.svg',
  url2: 'https://cdn.svgporn.com/logos/javascript.svg',
  base64:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  urlEncoded:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
  urlEncodedWithBase64:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1098px" height="768px" viewBox="-0.5 -0.5 1098 768"%3E%3Cdefs /%3E%3Cg%3E%3Ca xlink:href="/dashboard/dash-l1MVuUCUAQ67LmpaHyH6"%3E%3Cimage x="428.5" y="617.5" width="86.25" height="80" xlink:href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaWQ9ImZmZDY1ZWYwLTQ2ZjEtNDEyMy1hYTg2LTZjMjI0MzI5MmY1ZiIKICAgd2lkdGg9IjE4IgogICBoZWlnaHQ9IjE2Ljc2MDA3OCIKICAgdmlld0JveD0iMCAwIDE4IDE2Ljc2MDA3OCIKICAgdmVyc2lvbj0iMS4xIgogICBzb2RpcG9kaTpkb2NuYW1lPSJBenVyZV9BRF9CMkMuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkyLjMgKDI0MDU1NDYsIDIwMTgtMDMtMTEpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAxNyIKICAgICBpZD0ibmFtZWR2aWV3NTMwNjYiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIGZpdC1tYXJnaW4tdG9wPSIwIgogICAgIGZpdC1tYXJnaW4tbGVmdD0iMCIKICAgICBmaXQtbWFyZ2luLXJpZ2h0PSIwIgogICAgIGZpdC1tYXJnaW4tYm90dG9tPSIwIgogICAgIGlua3NjYXBlOnpvb209IjQ4LjExMTExMSIKICAgICBpbmtzY2FwZTpjeD0iOSIKICAgICBpbmtzY2FwZTpjeT0iOC4zODAwNzgxIgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJmZmQ2NWVmMC00NmYxLTQxMjMtYWE4Ni02YzIyNDMyOTJmNWYiIC8+CiAgPGRlZnMKICAgICBpZD0iZGVmczUzMDMzIj4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImFlMGM0ZTA4LTI0NDAtNDg4Yy1iYWUxLTY1MDljN2E0ZWYwNyIKICAgICAgIHgxPSIxMy4yNSIKICAgICAgIHkxPSIxMi44MyIKICAgICAgIHgyPSI4LjYxOTk5OTkiCiAgICAgICB5Mj0iNC4wNTk5OTk5IgogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiCiAgICAgICBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMC42MikiPgogICAgICA8c3RvcAogICAgICAgICBvZmZzZXQ9IjAiCiAgICAgICAgIHN0b3AtY29sb3I9IiMxOTg4ZDkiCiAgICAgICAgIGlkPSJzdG9wNTMwMjgiIC8+CiAgICAgIDxzdG9wCiAgICAgICAgIG9mZnNldD0iMC45IgogICAgICAgICBzdG9wLWNvbG9yPSIjNTRhZWYwIgogICAgICAgICBpZD0ic3RvcDUzMDMwIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPGcKICAgICBpZD0iZzUzMDYxIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTAuNjIpIj4KICAgIDxwb2x5Z29uCiAgICAgICBwb2ludHM9IjE2Ljk5LDkuOTkgMTgsMTEuMTYgOC45MywxNy4wMSAwLDExLjE3IDEuMDEsMTAuMDEgOC45MywxNS4xNCAiCiAgICAgICBpZD0icG9seWdvbjUzMDM1IgogICAgICAgc3R5bGU9ImZpbGw6IzUwZTZmZiIgLz4KICAgIDxwb2x5Z29uCiAgICAgICBwb2ludHM9IjE2LjQsOS4zNiA4LjkzLDE0LjA4IDEuNjEsOS4zNSA4LjkzLDAuNjIgIgogICAgICAgaWQ9InBvbHlnb241MzAzNyIKICAgICAgIHN0eWxlPSJmaWxsOiNmZmZmZmYiIC8+CiAgICA8cG9seWdvbgogICAgICAgcG9pbnRzPSIxLjYxLDkuMzUgOC45MywwLjYyIDguOTMsMTQuMDggIgogICAgICAgaWQ9InBvbHlnb241MzAzOSIKICAgICAgIHN0eWxlPSJmaWxsOiM1MGU2ZmYiIC8+CiAgICA8cG9seWdvbgogICAgICAgcG9pbnRzPSIxNi40LDkuMzYgOC45MywwLjYyIDguOTMsMTQuMDggIgogICAgICAgaWQ9InBvbHlnb241MzA0MSIKICAgICAgIHN0eWxlPSJmaWxsOnVybCgjYWUwYzRlMDgtMjQ0MC00ODhjLWJhZTEtNjUwOWM3YTRlZjA3KSIgLz4KICAgIDxwb2x5Z29uCiAgICAgICBwb2ludHM9IjguOTMsMTQuMDggOC45Myw3LjU3IDE2LjQsOS4zNiAiCiAgICAgICBpZD0icG9seWdvbjUzMDQzIgogICAgICAgc3R5bGU9ImZpbGw6IzUzYjFlMCIgLz4KICAgIDxwb2x5Z29uCiAgICAgICBwb2ludHM9IjguOTMsNy41NyA4LjkzLDE0LjA4IDEuNjEsOS4zNSAiCiAgICAgICBpZD0icG9seWdvbjUzMDQ1IgogICAgICAgc3R5bGU9ImZpbGw6IzljZWJmZiIgLz4KICAgIDxwb2x5Z29uCiAgICAgICBwb2ludHM9IjE2Ljk5LDkuOTkgOC45MywxNS4xNCA4LjkzLDE3LjAxIDE4LDExLjE2ICIKICAgICAgIGlkPSJwb2x5Z29uNTMwNDciCiAgICAgICBzdHlsZT0iZmlsbDojNWVhMGVmIiAvPgogICAgPHBhdGgKICAgICAgIGQ9Im0gMTcuNDUsMTYgYSAwLjQ0LDAuNDQgMCAwIDAgMC40NCwtMC40NCB2IDAgYSAyLjUsMi41IDAgMCAwIC0yLjQ1LC0yLjUgYyAtMS41MywwIC0yLjMyLDAuOTUgLTIuNDcsMi41IGEgMC40NSwwLjQ1IDAgMCAwIDAuMzksMC40OSBoIDQuMDkgeiIKICAgICAgIGlkPSJwYXRoNTMwNDkiCiAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgc3R5bGU9ImZpbGw6Izc3M2FkYyIgLz4KICAgIDxwYXRoCiAgICAgICBkPSJtIDE1LjQ0LDEzLjM4IGEgMS4zNSwxLjM1IDAgMCAxIC0wLjc1LC0wLjIyIGwgMC43NCwxLjkzIDAuNzMsLTEuOTIgYSAxLjM4LDEuMzggMCAwIDEgLTAuNzIsMC4yMSB6IgogICAgICAgaWQ9InBhdGg1MzA1MSIKICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICBzdHlsZT0ib3BhY2l0eTowLjg7ZmlsbDojZmZmZmZmIiAvPgogICAgPGNpcmNsZQogICAgICAgY3g9IjE1LjQ0IgogICAgICAgY3k9IjEyIgogICAgICAgcj0iMS4zOCIKICAgICAgIGlkPSJjaXJjbGU1MzA1MyIKICAgICAgIHN0eWxlPSJmaWxsOiM3NzNhZGMiIC8+CiAgICA8cGF0aAogICAgICAgZD0ibSAxNC42OCwxNy4zOCBhIDAuNjUsMC42NSAwIDAgMCAwLjY2LC0wLjY2IHYgLTAuMDggYyAtMC4yNiwtMi4wNSAtMS40MywtMy43MyAtMy42NywtMy43MyAtMi4yNCwwIC0zLjQ1LDEuNDIgLTMuNjcsMy43NCBhIDAuNjUsMC42NSAwIDAgMCAwLjU4LDAuNzIgaCA2LjExIHoiCiAgICAgICBpZD0icGF0aDUzMDU1IgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIHN0eWxlPSJmaWxsOiNhNjdhZjQiIC8+CiAgICA8cGF0aAogICAgICAgZD0ibSAxMS43LDEzLjQgYSAyLDIgMCAwIDEgLTEuMTEsLTAuMzMgbCAxLjEsMi45MyAxLjEsLTIuODcgQSAyLDIgMCAwIDEgMTEuNywxMy40IFoiCiAgICAgICBpZD0icGF0aDUzMDU3IgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIHN0eWxlPSJvcGFjaXR5OjAuODtmaWxsOiNmZmZmZmYiIC8+CiAgICA8Y2lyY2xlCiAgICAgICBjeD0iMTEuNjkiCiAgICAgICBjeT0iMTEuMzQiCiAgICAgICByPSIyLjA1OTk5OTkiCiAgICAgICBpZD0iY2lyY2xlNTMwNTkiCiAgICAgICBzdHlsZT0iZmlsbDojYTY3YWY0IiAvPgogIDwvZz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1MzA2MyI+CiAgICA8cmRmOlJERj4KICAgICAgPHJkZjpsaT5wdWJsaWM6dHJ1ZWU8L3JkZjpsaT4KICAgICAgPHJkZjpsaT5zZGs6ZmFsc2U8L3JkZjpsaT4KICAgICAgPHJkZjpsaT5jYXRlZ29yeTogSWRlbnRpdHk8L3JkZjpsaT4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+Cjwvc3ZnPgo=" /%3E%3C/a%3E%3C/g%3E%3C/svg%3E%0A',
  html: 'data:image/svg+xml,%3Chtml%20lang%3D%22en%22%3E%3Cbody%3EText%3C%2Fbody%3E%3C%2Fhtml%3E',
  string:
    '<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g> <polygon fill="#000000" points="7 5 7 19 18 12"></polygon></g></svg>',
} as const;

const mockOnError = jest.fn();
const mockOnLoad = jest.fn();

async function waitFor(callback: () => void) {
  await waitForBase(callback, {
    onTimeout: error => {
      console.log('waitFor timeout', error);

      return error;
    },
    timeout: 2000,
  });
}

function Loader() {
  return <div data-testid="Loader" />;
}

function setup({ onLoad, ...rest }: Props) {
  return render(
    <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} {...rest} />,
  );
}

describe('react-inlinesvg', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();

    cacheStore.clear();
  });

  describe('basic functionality', () => {
    it('should render a base64 src', async () => {
      const { container } = setup({
        src: fixtures.base64,
        title: 'base64',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an urlEncoded src', async () => {
      const { container } = setup({
        src: fixtures.urlEncoded,
        title: 'URL Encoded',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an urlEncodedWithBase64 src', async () => {
      const { container } = setup({
        src: fixtures.urlEncodedWithBase64,
        title: 'URL Encoded With Base 64',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg string src', async () => {
      const { container } = setup({
        src: fixtures.string,
        title: 'String',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an svg url and add title and description', async () => {
      const { container } = setup({
        src: fixtures.react,
        title: 'React FTW',
        description: 'React is a view library',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with mask, gradient and classes', async () => {
      const { container } = setup({
        src: fixtures.dots,
        title: 'Dots',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with external css, style and script', async () => {
      const { container } = setup({
        src: fixtures.circles,
        title: 'Circles',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with inline styles', async () => {
      const { container } = setup({
        src: fixtures.styles,
        uniquifyIDs: true,
        uniqueHash: 'test',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with symbols', async () => {
      const { container } = setup({ src: fixtures.icons });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with utf-8 characters', async () => {
      const { container } = setup({ src: fixtures.utf8 });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an svg url and replace existing title and description', async () => {
      const { container } = setup({
        src: fixtures.tiger,
        title: 'The Tiger',
        description: 'Is this a tiger?',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a loader', async () => {
      const { container } = setup({
        src: fixtures.play,
        loader: <Loader />,
      });

      expect(container).toMatchSnapshot();

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle empty src changes', async () => {
      const { container, rerender } = setup({ src: '' });

      expect(container.firstChild).toMatchSnapshot();

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.react}
        />,
      );

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle src changes to empty', async () => {
      const { container, rerender } = setup({ src: fixtures.react });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();

      rerender(
        <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src="" />,
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
      });
    });

    it('should uniquify ids with the random uniqueHash', async () => {
      const { container } = setup({
        src: fixtures.play,
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('radialGradient')?.outerHTML).toEqual(
        expect.stringMatching(/radialGradient-1__.*?/),
      );
    });

    it('should uniquify ids with a custom uniqueHash', async () => {
      const { container } = setup({
        src: fixtures.play,
        uniqueHash: 'test',
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should prefix the ids with the baseURL', async () => {
      const { container } = setup({
        src: fixtures.play,
        baseURL: 'https://example.com/',
        uniqueHash: 'test',
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should not uniquify non-id hrefs', async () => {
      const { container } = setup({
        src: fixtures.datahref,
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should transform the SVG text with the preProcessor prop', async () => {
      const extraProp = 'data-isvg="test"';
      const { container } = setup({
        src: fixtures.play,
        preProcessor: svgText => svgText.replace('<svg ', `<svg ${extraProp} `),
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle innerRef', async () => {
      const innerRef = React.createRef<SVGElement>();

      const { container } = setup({
        src: fixtures.play,
        innerRef,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
      expect(innerRef.current).toMatchSnapshot();
    });

    it('should handle fetchOptions', async () => {
      fetchMock.enableMocks();

      setup({
        cacheRequests: false,
        src: fixtures.react,
        fetchOptions: {
          headers: {
            Authorization: 'Bearer ad99d8d5-419d-434e-97c2-3ce52e116d52',
          },
        },
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:1337/react.svg', {
          headers: {
            Authorization: 'Bearer ad99d8d5-419d-434e-97c2-3ce52e116d52',
          },
        });
      });

      fetchMock.disableMocks();
    });

    it('should handle custom props', async () => {
      const { container } = setup({
        src: fixtures.react,
        style: { width: 100 },
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should remove the title', async () => {
      const { container } = setup({
        src: fixtures.react,
        title: null,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });
  });

  describe('cached requests', () => {
    beforeAll(() => {
      fetchMock.enableMocks();
    });

    afterAll(() => {
      fetchMock.disableMocks();
    });

    it('should request an SVG only once', async () => {
      fetchMock.mockResponseOnce(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  body: '<svg><title>React</title><circle /></svg>',
                  headers: { 'Content-Type': 'image/svg+xml' },
                }),
              500,
            );
          }),
      );

      setup({ src: fixtures.url });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.url, true);
      });

      setup({ src: fixtures.url });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(2, fixtures.url, true);
      });

      expect(fetchMock).toHaveBeenNthCalledWith(1, fixtures.url, undefined);

      expect(cacheStore.isCached(fixtures.url)).toBeTrue();
    });

    it('should handle multiple simultaneous instances with the same url', async () => {
      fetchMock.mockResponseOnce(() =>
        Promise.resolve({
          body: '<svg><title>React</title><circle /></svg>',
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      );

      render(
        <>
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.url} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.url} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.url} />
        </>,
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(3, fixtures.url, true);
      });
    });

    it('should handle request fail with multiple instances', async () => {
      fetchMock.mockRejectOnce(new Error('500')).mockRejectOnce(new Error('500'));

      setup({
        src: fixtures.url2,
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledTimes(1);
      });

      setup({
        src: fixtures.url2,
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle cached entries with loading status', async () => {
      fetchMock.mockResponseOnce(() =>
        Promise.resolve({
          body: '<svg><title>React</title><circle /></svg>',
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      );

      cacheStore.set(fixtures.react, {
        content: '',
        status: 'loading',
      });

      setup({ src: fixtures.react });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.react, true);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(cacheStore.keys()).toEqual([fixtures.react]);
    });

    it('should handle cached entries with loading status on error', async () => {
      const error = new Error('Failed to fetch');

      fetchMock.mockResponseOnce(() => Promise.reject(error));

      cacheStore.set(fixtures.react, {
        content: '',
        status: 'loading',
      });

      setup({ src: fixtures.react });

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenNthCalledWith(1, error);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should skip the cache if `cacheRequest` is false', async () => {
      fetchMock.mockResponseOnce(() =>
        Promise.resolve({
          body: '<svg><circle /></svg>',
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      );

      setup({
        cacheRequests: false,
        src: fixtures.url,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.url, false);
      });

      expect(fetchMock.mock.calls).toHaveLength(1);

      expect(cacheStore.keys()).toHaveLength(0);
    });
  });

  describe('integration', () => {
    beforeAll(() => {
      fetchMock.resetMocks();
    });

    it('should handle race condition with fast src changes', async () => {
      fetchMock.enableMocks();
      fetchMock
        .mockResponseOnce(
          () =>
            new Promise(resolve => {
              setTimeout(
                () =>
                  resolve({
                    body: '<svg><title>React</title><circle /></svg>',
                    headers: { 'Content-Type': 'image/svg+xml' },
                  }),
                0,
              );
            }),
        )
        .mockResponseOnce(
          () =>
            new Promise(resolve => {
              setTimeout(
                () =>
                  resolve({
                    body: '<svg><title>React</title><circle /></svg>',
                    headers: { 'Content-Type': 'image/svg+xml' },
                  }),
                0,
              );
            }),
        );

      const { container, rerender } = setup({ src: fixtures.react, title: 'React' });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenNthCalledWith(1, fixtures.react, undefined);
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.react, true);
      });

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.url2}
          title="Javascript"
        />,
      );

      await waitFor(() => {
        expect(fetchMock).toHaveBeenNthCalledWith(2, fixtures.url2, undefined);
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(2, fixtures.url2, true);
      });

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.react}
        />,
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(3, fixtures.react, true);
      });

      expect(container.querySelector('svg')).toMatchSnapshot('svg');

      expect(cacheStore.keys()).toMatchSnapshot('cacheStore');

      fetchMock.disableMocks();
    });

    it('should render multiple SVGs', async () => {
      const { container } = render(
        <div>
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.react} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.circles} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.dots} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.datahref} />
        </div>,
      );

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(4);
      });

      expect(container.querySelectorAll('svg')).toHaveLength(4);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should handle pre-cached entries in the cacheStore', async () => {
      fetchMock.enableMocks();

      cacheStore.set(fixtures.react, {
        content: '<svg><circle /></svg>',
        status: 'loaded',
      });

      const { container } = render(<ReactInlineSVG onLoad={mockOnLoad} src={fixtures.react} />);

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);

      expect(container.querySelector('svg')).toMatchSnapshot();

      // clean up
      fetchMock.disableMocks();
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      mockOnError.mockClear();
    });

    it('should trigger an error if empty', async () => {
      // @ts-ignore
      const { container } = setup({});

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
      });

      expect(container.querySelector('svg')).toBeNull();
    });

    it('should trigger an error on empty `src` prop changes', async () => {
      const { container, rerender } = setup({
        src: fixtures.urlEncoded,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();

      rerender(
        <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src="" />,
      );

      expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
    });

    it('should trigger an error and render the fallback children if src is not found', async () => {
      const { container } = setup({
        src: 'http://127.0.0.1:1337/DOESNOTEXIST.svg',
        children: (
          <div className="missing">
            <span>MISSING</span>
          </div>
        ),
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Not found'));
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should trigger an error if the request content-type is not valid', async () => {
      setup({ src: fixtures.react_png });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error("Content type isn't valid: image/png"));
      });
    });

    it('should trigger an error if the content is not valid', async () => {
      setup({ src: fixtures.html });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          new Error('Could not convert the src to a React element'),
        );
      });
    });
  });
});
