cmake_minimum_required(VERSION 3.20)
project(TradingFloorHftCore LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(TradingFloorHftCore SHARED
    HftCoreDll.cpp
    SPSCRingBuffer.hpp
    QuantModels.hpp
    FixProtocolFast.hpp
)

target_compile_definitions(TradingFloorHftCore PRIVATE WIN32_LEAN_AND_MEAN NOMINMAX)

if(MSVC)
    target_compile_options(TradingFloorHftCore PRIVATE /O2 /Oi /Ot /GL /Gy /arch:AVX2 /W4)
    target_link_options(TradingFloorHftCore PRIVATE /LTCG)
else()
    target_compile_options(TradingFloorHftCore PRIVATE -O3 -mavx2 -Wall -Wextra)
endif()
