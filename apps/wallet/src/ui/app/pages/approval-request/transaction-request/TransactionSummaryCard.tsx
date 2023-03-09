// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useFormatCoin } from '@mysten/core';
import {
    formatAddress,
    getTotalGasUsed,
    type Transaction,
    type SuiAddress,
} from '@mysten/sui.js';
import { useMemo } from 'react';

import { MiniNFT } from './MiniNFT';
import { SummaryCard } from './SummaryCard';
import { AccountAddress } from '_components/AccountAddress';
import ExplorerLink from '_components/explorer-link';
import { ExplorerLinkType } from '_components/explorer-link/ExplorerLinkType';
import { useGetNFTMeta, useTransactionDryRun } from '_hooks';
import { GAS_TYPE_ARG } from '_redux/slices/sui-objects/Coin';
import {
    getEventsSummary,
    type CoinsMetaProps,
} from '_src/ui/app/helpers/getEventsSummary';

import st from './TransactionRequest.module.scss';

type TransferSummerCardProps = {
    coinsMeta: CoinsMetaProps[];
    objectIDs: string[];
    gasEstimate?: number | null;
    addressForTransaction: SuiAddress;
};

function MiniNFTLink({ id }: { id: string }) {
    const { data: nftMeta } = useGetNFTMeta(id);
    return (
        <>
            {nftMeta && (
                <MiniNFT
                    url={nftMeta.url}
                    name={nftMeta?.name || 'NFT Image'}
                    size="xs"
                />
            )}
            <ExplorerLink
                type={ExplorerLinkType.object}
                objectID={id}
                className={st.objectId}
                showIcon={false}
            >
                {formatAddress(id)}
            </ExplorerLink>
        </>
    );
}

function CoinMeta({
    receiverAddress,
    coinMeta,
    addressForTransaction,
}: {
    receiverAddress: string;
    coinMeta: CoinsMetaProps;
    addressForTransaction: SuiAddress;
}) {
    const [formattedAmount, symbol] = useFormatCoin(
        coinMeta.amount ? Math.abs(coinMeta.amount) : 0,
        coinMeta.coinType
    );

    // TODO add receiver address;
    // Currently dry_run does not return receiver address for transactions init by Move contract
    const showAddress = receiverAddress !== addressForTransaction;

    /// A net positive amount means the user received coins and verse versa.
    const sendLabel = coinMeta.amount < 0 ? 'Send' : 'Receive';
    const receiveLabel = coinMeta.amount < 0 ? 'To' : 'From';

    return (
        <div className={st.content}>
            <div className={st.row}>
                <div className={st.label}>{sendLabel}</div>
                <div className={st.value}>
                    {formattedAmount} {symbol}
                </div>
            </div>

            <div className={st.row}>
                <div className={st.label}>{showAddress && receiveLabel}</div>
                <div className={st.value}>
                    <div className={st.value}>
                        {showAddress && (
                            <ExplorerLink
                                type={ExplorerLinkType.address}
                                address={receiverAddress}
                                className={st.objectId}
                                showIcon={false}
                            >
                                {formatAddress(receiverAddress)}
                            </ExplorerLink>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TransactionSummary({
    objectIDs,
    coinsMeta,
    gasEstimate,
    addressForTransaction,
}: TransferSummerCardProps) {
    const [gasEst, gasSymbol] = useFormatCoin(gasEstimate || 0, GAS_TYPE_ARG);

    return (
        <SummaryCard header="Transaction summary">
            {coinsMeta &&
                coinsMeta.map((coinMeta) => (
                    <CoinMeta
                        receiverAddress={coinMeta.receiverAddress}
                        key={coinMeta.receiverAddress + coinMeta.coinType}
                        coinMeta={coinMeta}
                        addressForTransaction={addressForTransaction}
                    />
                ))}
            {objectIDs.length > 0 && (
                <div className={st.content}>
                    {objectIDs.map((objectId) => (
                        <div className={st.row} key={objectId}>
                            <div className={st.label}>Send</div>
                            <div className={st.value}>
                                <MiniNFTLink id={objectId} />
                            </div>
                        </div>
                    ))}

                    <div className={st.row}>
                        <div className={st.label}>To</div>
                        <div className={st.value}>
                            <AccountAddress address={addressForTransaction} />
                        </div>
                    </div>
                </div>
            )}

            <div className={st.cardFooter}>
                <div>Estimated Gas Fees</div>
                {gasEst} {gasSymbol}
            </div>
        </SummaryCard>
    );
}

export function TransactionSummaryCard({
    transaction,
    address,
}: {
    transaction: Transaction;
    address: string;
}) {
    const { data } = useTransactionDryRun(address, transaction);

    const eventsSummary = useMemo(
        () => (data ? getEventsSummary(data.events, address) : null),
        [data, address]
    );

    const gasEstimation = data && getTotalGasUsed(data.effects);

    if (!eventsSummary) {
        return null;
    }
    return (
        <TransactionSummary
            objectIDs={eventsSummary.objectIDs}
            coinsMeta={eventsSummary.coins}
            gasEstimate={gasEstimation}
            addressForTransaction={address}
        />
    );
}
