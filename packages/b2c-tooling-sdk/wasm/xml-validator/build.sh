#!/usr/bin/env bash
# Builds the XML Schema validator (libxml2 compiled to WebAssembly) from pinned
# sources inside the pinned emsdk container, and writes the artifacts to
# data/xml-validator/ (or the directory given as the first argument).
#
# The build is reproducible: the same inputs produce byte-identical output on
# any host architecture. CI rebuilds and compares against the committed files.
#
# Usage: ./build.sh [out-dir]
set -euo pipefail

LIBXML2_VERSION=2.15.4
LIBXML2_SHA256=98087fd181d9070724f3fbc65c7377db03038eb92bd882374daff44940138821
LIBXML2_URL="https://download.gnome.org/sources/libxml2/${LIBXML2_VERSION%.*}/libxml2-${LIBXML2_VERSION}.tar.xz"

here="$(cd "$(dirname "$0")" && pwd)"
default_out="$here/../../data/xml-validator"
out_arg="${1:-$default_out}"
mkdir -p "$out_arg"
out="$(cd "$out_arg" && pwd)"

if [ "${IN_CONTAINER:-}" != "1" ]; then
  platform_args=()
  if [ -n "${DOCKER_PLATFORM:-}" ]; then platform_args=(--platform "$DOCKER_PLATFORM"); fi
  image=$(docker build -q "${platform_args[@]}" "$here")
  exec docker run --rm "${platform_args[@]}" \
    -e IN_CONTAINER=1 -e SOURCE_DATE_EPOCH=0 \
    -v "$here:/src:ro" -v "$out:/out" \
    "$image" /src/build.sh /out
fi

# Fixed paths inside the container keep the output independent of the host.
work=/build
rm -rf "$work" && mkdir -p "$work" && cd "$work"

curl -fsSL "$LIBXML2_URL" -o libxml2.tar.xz
echo "$LIBXML2_SHA256  libxml2.tar.xz" | sha256sum -c -
tar xf libxml2.tar.xz
src="$work/libxml2-$LIBXML2_VERSION"
cd "$src"

# Only the parser, streaming reader, and XML Schema support are compiled in.
# HTTP was removed from libxml2 in 2.15; catalogs, iconv, zlib, threads, and
# dynamic modules are disabled.
PKG_CONFIG=/bin/true CFLAGS="-Oz -g0 -ffile-prefix-map=$work=." emconfigure ./configure \
  --host=wasm32-unknown-emscripten --disable-shared --enable-static \
  --with-minimum --with-schemas --with-reader --with-regexps --with-pattern \
  --without-iconv --without-zlib --without-python --without-threads \
  --without-modules --without-catalog --without-http --without-debug \
  >/dev/null
emmake make -j"$(nproc)" libxml2.la >/dev/null

emcc -Oz -g0 "-ffile-prefix-map=$work=." -I include \
  /src/xml_validator.c .libs/libxml2.a \
  -o "$work/xml-validator.mjs" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=node \
  -sALLOW_MEMORY_GROWTH=1 -sMAXIMUM_MEMORY=2GB \
  -sFORCE_FILESYSTEM=1 -sEXIT_RUNTIME=0 \
  -sEXPORTED_RUNTIME_METHODS=FS,cwrap,UTF8ToString \
  -sEXPORTED_FUNCTIONS=_malloc,_free

# License notices for everything compiled into the artifacts.
notices="$work/THIRD-PARTY-NOTICES"
{
  echo "The files in this directory are built by packages/b2c-tooling-sdk/wasm/xml-validator/build.sh"
  echo "and contain code from the following projects."
  echo
  echo "================================================================================"
  echo "libxml2 $LIBXML2_VERSION (https://gitlab.gnome.org/GNOME/libxml2)"
  echo "================================================================================"
  echo
  cat "$src/Copyright"
  for f in dict.c list.c; do
    echo
    echo "--- $f ---"
    sed -n '1,/\*\//p' "$src/$f"
  done
  echo
  echo "================================================================================"
  echo "Emscripten $(cat "$EMSDK/upstream/emscripten/emscripten-version.txt" | tr -d '"') (https://emscripten.org) - JavaScript runtime and system libraries"
  echo "================================================================================"
  echo
  cat "$EMSDK/upstream/emscripten/LICENSE"
  echo
  echo "================================================================================"
  echo "musl libc (bundled with Emscripten)"
  echo "================================================================================"
  echo
  cat "$EMSDK/upstream/emscripten/system/lib/libc/musl/COPYRIGHT"
} >"$notices"

cp "$work/xml-validator.mjs" "$work/xml-validator.wasm" "$notices" /out/
chmod 644 /out/xml-validator.mjs /out/xml-validator.wasm /out/THIRD-PARTY-NOTICES
cd /out
sha256sum xml-validator.mjs xml-validator.wasm THIRD-PARTY-NOTICES | tee SHA256SUMS
