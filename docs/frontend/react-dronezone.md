

# react-dropzone

Simple React hook to create a HTML5-compliant drag'n'drop zone for files.

Documentation and examples at [https://react-dropzone.js.org](https://react-dropzone.js.org). Source code at [https://github.com/react-dropzone/react-dropzone/](https://github.com/react-dropzone/react-dropzone/).

## Installation

Install it from npm and include it in your React build process (using [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/), etc).

npm install --save react-dropzone

or:

yarn add react-dropzone

## Usage

You can either use the hook:

import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const onDrop \= useCallback(acceptedFiles \=> {
    // Do something with the files
  }, \[\])
  const {getRootProps, getInputProps, isDragActive} \= useDropzone({onDrop})

  return (
    <div {...getRootProps()}\>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p\>Drop the files here ...</p\> :
          <p\>Drag 'n' drop some files here, or click to select files</p\>
      }
    </div\>
  )
}

Or the wrapper component for the hook:

import React from 'react'
import Dropzone from 'react-dropzone'

<Dropzone onDrop\={acceptedFiles \=> console.log(acceptedFiles)}\>
  {({getRootProps, getInputProps}) \=> (
    <section\>
      <div {...getRootProps()}\>
        <input {...getInputProps()} />
        <p\>Drag 'n' drop some files here, or click to select files</p\>
      </div\>
    </section\>
  )}
</Dropzone\>

If you want to access file contents you have to use the [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader):

import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const onDrop \= useCallback((acceptedFiles) \=> {
    acceptedFiles.forEach((file) \=> {
      const reader \= new FileReader()

      reader.onabort \= () \=> console.log('file reading was aborted')
      reader.onerror \= () \=> console.log('file reading has failed')
      reader.onload \= () \=> {
      // Do whatever you want with the file contents
        const binaryStr \= reader.result
        console.log(binaryStr)
      }
      reader.readAsArrayBuffer(file)
    })
    
  }, \[\])
  const {getRootProps, getInputProps} \= useDropzone({onDrop})

  return (
    <div {...getRootProps()}\>
      <input {...getInputProps()} />
      <p\>Drag 'n' drop some files here, or click to select files</p\>
    </div\>
  )
}

## Dropzone Props Getters

The dropzone property getters are just two functions that return objects with properties which you need to use to create the drag 'n' drop zone. The root properties can be applied to whatever element you want, whereas the input properties must be applied to an `<input>`:

import React from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const {getRootProps, getInputProps} \= useDropzone()

  return (
    <div {...getRootProps()}\>
      <input {...getInputProps()} />
      <p\>Drag 'n' drop some files here, or click to select files</p\>
    </div\>
  )
}

Note that whatever other props you want to add to the element where the props from `getRootProps()` are set, you should always pass them through that function rather than applying them on the element itself. This is in order to avoid your props being overridden (or overriding the props returned by `getRootProps()`):

<div
  {...getRootProps({
    onClick: event \=\> console.log(event),
    role: 'button',
    'aria-label': 'drag and drop area',
    ...
  })}
/>

In the example above, the provided `{onClick}` handler will be invoked before the internal one, therefore, internal callbacks can be prevented by simply using [stopPropagation](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation). See [Events](https://react-dropzone.js.org#events) for more examples.

_Important_: if you omit rendering an `<input>` and/or binding the props from `getInputProps()`, opening a file dialog will not be possible.

## Refs

Both `getRootProps` and `getInputProps` accept a custom `refKey` (defaults to `ref`) as one of the attributes passed down in the parameter.

This can be useful when the element you're trying to apply the props from either one of those fns does not expose a reference to the element, e.g:

import React from 'react'
import {useDropzone} from 'react-dropzone'
// NOTE: After v4.0.0, styled components exposes a ref using forwardRef,
// therefore, no need for using innerRef as refKey
import styled from 'styled-components'

const StyledDiv \= styled.div\`
  // Some styling here
\`
function Example() {
  const {getRootProps, getInputProps} \= useDropzone()
  <StyledDiv {...getRootProps({ refKey: 'innerRef' })}\>
    <input {...getInputProps()} />
    <p\>Drag 'n' drop some files here, or click to select files</p\>
  </StyledDiv\>
}

If you're working with [Material UI v4](https://v4.mui.com/) and would like to apply the root props on some component that does not expose a ref, use [RootRef](https://v4.mui.com/api/root-ref/):

import React from 'react'
import {useDropzone} from 'react-dropzone'
import RootRef from '@material-ui/core/RootRef'

function PaperDropzone() {
  const {getRootProps, getInputProps} \= useDropzone()
  const {ref, ...rootProps} \= getRootProps()

  <RootRef rootRef\={ref}\>
    <Paper {...rootProps}\>
      <input {...getInputProps()} />
      <p\>Drag 'n' drop some files here, or click to select files</p\>
    </Paper\>
  </RootRef\>
}

**IMPORTANT**: do not set the `ref` prop on the elements where `getRootProps()`/`getInputProps()` props are set, instead, get the refs from the hook itself:

import React from 'react'
import {useDropzone} from 'react-dropzone'

function Refs() {
  const {
    getRootProps,
    getInputProps,
    rootRef, // Ref to the \`<div>\`
    inputRef // Ref to the \`<input>\`
  } \= useDropzone()
  <div {...getRootProps()}\>
    <input {...getInputProps()} />
    <p\>Drag 'n' drop some files here, or click to select files</p\>
  </div\>
}

If you're using the `<Dropzone>` component, though, you can set the `ref` prop on the component itself which will expose the `{open}` prop that can be used to open the file dialog programmatically:

import React, {createRef} from 'react'
import Dropzone from 'react-dropzone'

const dropzoneRef \= createRef()

<Dropzone ref\={dropzoneRef}\>
  {({getRootProps, getInputProps}) \=> (
    <div {...getRootProps()}\>
      <input {...getInputProps()} />
      <p\>Drag 'n' drop some files here, or click to select files</p\>
    </div\>
  )}
</Dropzone\>

dropzoneRef.open()

## Testing

`react-dropzone` makes some of its drag 'n' drop callbacks asynchronous to enable promise based `getFilesFromEvent()` functions. In order to test components that use this library, you need to use the [react-testing-library](https://github.com/testing-library/react-testing-library):

import React from 'react'
import Dropzone from 'react-dropzone'
import {act, fireEvent, render} from '@testing-library/react'

test('invoke onDragEnter when dragenter event occurs', async () \=> {
  const file \= new File(\[
    JSON.stringify({ping: true})
  \], 'ping.json', { type: 'application/json' })
  const data \= mockData(\[file\])
  const onDragEnter \= jest.fn()

  const ui \= (
    <Dropzone onDragEnter\={onDragEnter}\>
      {({ getRootProps, getInputProps }) \=> (
        <div {...getRootProps()}\>
          <input {...getInputProps()} /\>
        </div\>
      )}
    </Dropzone\>
  )
  const { container } \= render(ui)

  await act(
    () \=> fireEvent.dragEnter(
      container.querySelector('div'),
      data,
    )
  );
  expect(onDragEnter).toHaveBeenCalled()
})

function mockData(files) {
  return {
    dataTransfer: {
      files,
      items: files.map(file \=> ({
        kind: 'file',
        type: file.type,
        getAsFile: () \=> file
      })),
      types: \['Files'\]
    }
  }
}

**NOTE**: using [Enzyme](https://airbnb.io/enzyme) for testing is not supported at the moment, see [#2011](https://github.com/airbnb/enzyme/issues/2011).

More examples for this can be found in `react-dropzone`'s own [test suites](https://github.com/react-dropzone/react-dropzone/blob/master/src/index.spec.js).

## Caveats

### Required React Version

React [16.8](https://reactjs.org/blog/2019/02/06/react-v16.8.0.html) or above is required because we use [hooks](https://reactjs.org/docs/hooks-intro.html) (the lib itself is a hook).

### File Paths

Files returned by the hook or passed as arg to the `onDrop` cb won't have the properties `path` or `fullPath`. For more inf check [this SO question](https://stackoverflow.com/a/23005925/2275818) and [this issue](https://github.com/react-dropzone/react-dropzone/issues/477).

### Not a File Uploader

This lib is not a file uploader; as such, it does not process files or provide any way to make HTTP requests to some server; if you're looking for that, checkout [filepond](https://pqina.nl/filepond) or [uppy.io](https://uppy.io/).

### Using <label> as Root

If you use [<label>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) as the root element, the file dialog will be opened twice; see [#1107](https://github.com/react-dropzone/react-dropzone/issues/1107) why. To avoid this, use `noClick`:

import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const {getRootProps, getInputProps} \= useDropzone({noClick: true})

  return (
    <label {...getRootProps()}\>
      <input {...getInputProps()} />
    </label\>
  )
}

### Using open() on Click

If you bind a click event on an inner element and use `open()`, it will trigger a click on the root element too, resulting in the file dialog opening twice. To prevent this, use the `noClick` on the root:

import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

function MyDropzone() {
  const {getRootProps, getInputProps, open} \= useDropzone({noClick: true})

  return (
    <div {...getRootProps()}\>
      <input {...getInputProps()} />
      <button type\="button" onClick\={open}\>
        Open
      </button\>
    </div\>
  )
}

### File Dialog Cancel Callback

The `onFileDialogCancel()` cb is unstable in most browsers, meaning, there's a good chance of it being triggered even though you have selected files.

We rely on using a timeout of `300ms` after the window is focused (the window `onfocus` event is triggered when the file select dialog is closed) to check if any files were selected and trigger `onFileDialogCancel` if none were selected.

As one can imagine, this doesn't really work if there's a lot of files or large files as by the time we trigger the check, the browser is still processing the files and no `onchange` events are triggered yet on the input. Check [#1031](https://github.com/react-dropzone/react-dropzone/issues/1031) for more info.

Fortunately, there's the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), which is currently a working draft and some browsers support it (see [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#browser_compatibility)), that provides a reliable way to prompt the user for file selection and capture cancellation.

Also keep in mind that the FS access API can only be used in [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).

**NOTE** You can enable using the FS access API with the `useFsAccessApi` property: `useDropzone({useFsAccessApi: true})`.

### File System Access API

When setting `useFsAccessApi` to `true`, you're switching to the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (see the [file system access](https://wicg.github.io/file-system-access/) RFC).

What this essentially does is that it will use the [showOpenFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker) method to open the file picker window so that the user can select files.

In contrast, the traditional way (when the `useFsAccessApi` is not set to `true` or not specified) uses an `<input type="file">` (see [docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)) on which a click event is triggered.

With the use of the file system access API enabled, there's a couple of caveats to keep in mind:

1.  The users will not be able to select directories
2.  It requires the app to run in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
3.  In [Electron](https://www.electronjs.org/), the path may not be set (see [#1249](https://github.com/react-dropzone/react-dropzone/issues/1249))

## Supported Browsers

We use [browserslist](https://github.com/browserslist/browserslist) config to state the browser support for this lib, so check it out on [browserslist.dev](https://browserslist.dev/?q=ZGVmYXVsdHM%3D).

## Need image editing?

React Dropzone integrates perfectly with [Pintura Image Editor](https://pqina.nl/pintura/?ref=react-dropzone), creating a modern image editing experience. Pintura supports crop aspect ratios, resizing, rotating, cropping, annotating, filtering, and much more.

Checkout the [Pintura integration example](https://codesandbox.io/s/react-dropzone-pintura-40xh4?file=/src/App.js).

