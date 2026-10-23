import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { validateAuction, PLAYER_UUID } from './auctionContracts.js';

export function useAuctionPrivateReview({auction,leagueId,context}) {
  const [review,setReview]=useState(null);
  const [reason,setReason]=useState('');
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current+=1;},[]);
  const mutation=useMutation({gcTime:0,mutationFn:async ({bidId,epoch})=>{
    const validate=data=>{
        validateAuction(data.auction);
        if(data.leagueId!==leagueId||data.auctionId!==auction.auctionId||data.auction.leagueId!==leagueId||
           data.auction.auctionId!==auction.auctionId||!PLAYER_UUID.test(data.revealId)||!Number.isSafeInteger(data.expiresAtMs)||
           (bidId===null ? data.terms!==null : data.terms?.bidId!==bidId||!Number.isSafeInteger(data.terms.totalValueCents)||data.terms.totalValueCents<1||!Number.isSafeInteger(data.terms.termYears)||data.terms.termYears<1)) throw Error('Private review could not be verified.');
        return true;
    };
    const response=await context.session.httpClient.request(`/api/v1/leagues/${leagueId}/auctions/${auction.auctionId}/administration/reveal`,{
      method:'POST',authenticated:true,dataKind:'object',idempotencyKey:createIdempotencyKey('auction-private-review'),
      body:{confirmed:true,reason,bidId},validateData:validate,
    });
    validate(response.data);
    return {data:response.data,epoch};
  },onSuccess:({data,epoch})=>{if(epoch===generation.current)setReview(data);}});
  const reset=mutation.reset;
  useEffect(()=>{
    if(!review)return undefined;
    const timer=setTimeout(()=>{generation.current+=1;setReview(null);reset();},Math.max(0,Math.min(300000,review.expiresAtMs-Date.now())));
    return()=>clearTimeout(timer);
  },[review,reset]);
  const current=review?.auction.version===auction.version && review?.auctionId===auction.auctionId ? review:null;
  return {review:current,reason,setReason,reveal:bidId=>mutation.mutate({bidId,epoch:generation.current}),busy:mutation.isPending,error:mutation.error,
    hide:()=>{generation.current+=1;setReview(null);setReason('');reset();}};
}
